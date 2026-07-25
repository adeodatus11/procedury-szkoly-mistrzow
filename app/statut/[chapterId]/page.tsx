import Link from "next/link";
import { notFound } from "next/navigation";
import { siteStats, statuteChapters } from "../../content";
import { getStructuredLineClassName, renderStructuredText, statuteChapterHref } from "../../content-utils";
import { buildInlineDiff, buildTextDiff } from "../../statute-diff.mjs";
import {
  getStatuteProposal,
  statuteProposalChangeCount,
  statuteProposalMeta,
} from "../../statute-proposals";

type PageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

function DiffSegments({ segments }: { segments: ReturnType<typeof buildInlineDiff> }) {
  return segments.map((segment, index) =>
    segment.kind === "unchanged" ? (
      segment.text
    ) : (
      <span className={`statute-diff statute-diff-${segment.kind}`} key={`${segment.kind}-${index}`}>
        {segment.text}
      </span>
    ),
  );
}

function StatuteDiffBody({ current, proposed }: { current: string; proposed: string }) {
  return buildTextDiff(current, proposed).map((line, index) => (
    <p className={`${getStructuredLineClassName(line.source)} statute-diff-line`} key={`${line.source.slice(0, 28)}-${index}`}>
      <DiffSegments segments={line.segments} />
    </p>
  ));
}

export function generateStaticParams() {
  return statuteChapters.map((chapter) => ({
    chapterId: chapter.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { chapterId } = await params;
  const chapter = statuteChapters.find((item) => item.id === chapterId);

  return {
    title: chapter ? `${chapter.title} | Statut ZSZ nr 5` : "Statut ZSZ nr 5",
  };
}

export default async function StatuteChapterPage({ params }: PageProps) {
  const { chapterId } = await params;
  const chapter = statuteChapters.find((item) => item.id === chapterId);

  if (!chapter) notFound();

  return (
    <main>
      <header className="site-header">
        <nav className="topbar" aria-label="Główna nawigacja">
          <Link className="brand" href="/">
            <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
          </Link>
          <div className="topbar-links">
            <Link href="/">Strona główna</Link>
            <Link href="/#dokumenty">Dokumenty</Link>
            <Link href="/statut">Statut</Link>
            <Link href="/wzory">Wzory pism</Link>
            <Link href="/braki">Braki</Link>
          </div>
        </nav>
      </header>

      <section className="statute-section">
        <div className="section-heading">
          <p>Porównanie robocze</p>
          <h1>{chapter.title}</h1>
          <p className="section-lead">
            Po lewej stronie znajduje się tekst jednolity z 15 października 2025 r., a po prawej propozycja
            uproszczenia i aktualizacji zachowująca rozwiązania właściwe dla ZSZ nr 5.
          </p>
        </div>
        <div className="statute-proposal-notice">
          <strong>{statuteProposalMeta.notice}</strong>
          <p>{statuteProposalMeta.method}</p>
          <div className="statute-comparison-summary" aria-label="Zakres porównania">
            <span>Stan kwerendy: {statuteProposalMeta.asOf}</span>
            <span>{statuteProposalChangeCount} paragrafów z propozycją zmiany</span>
            <span>Pozostałe paragrafy zachowane bez zmian</span>
          </div>
          <div className="statute-diff-legend" aria-label="Legenda oznaczeń zmian">
            <strong>Oznaczenia zmian:</strong>
            <span>
              <span className="statute-diff statute-diff-removed">tekst usunięty</span>
            </span>
            <span>
              <span className="statute-diff statute-diff-changed">tekst zmieniony</span>
            </span>
            <span>
              <span className="statute-diff statute-diff-added">tekst nowy</span>
            </span>
          </div>
        </div>
        <section className="statute-legal-basis" aria-labelledby="statute-legal-basis-title">
          <div>
            <p>Podstawa prawna i źródła metodyczne</p>
            <h2 id="statute-legal-basis-title">Źródła wykorzystane do porównania</h2>
          </div>
          <div className="statute-source-links">
            {statuteProposalMeta.sources.map((source) => (
              <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
                {source.label}
              </a>
            ))}
          </div>
        </section>
        <div className="reader-layout">
          <aside className="reader-toc" aria-label="Spis treści statutu">
            <div className="reader-toc-header">
              <strong>{statuteChapters.length}</strong>
              <span>rozdziałów</span>
            </div>
            <a className="reader-download" href={siteStats.statuteDownload}>
              Pobierz oryginalny PDF
            </a>
            <nav>
              {statuteChapters.map((item) => (
                <Link className={item.id === chapter.id ? "active" : ""} href={statuteChapterHref(item.id)} key={item.id}>
                  {item.title}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="statute-reader">
            {chapter.sections.map((section) => {
              const proposal = getStatuteProposal(section);

              return (
                <article
                  className={`statute-comparison-row${proposal.changed ? " has-proposal" : ""}`}
                  id={section.id}
                  key={section.id}
                >
                  <section className="statute-version statute-version-current" aria-label={`Aktualne brzmienie ${section.title}`}>
                    <div className="statute-version-heading">
                      <span>Aktualne brzmienie</span>
                      <small>tekst z 15.10.2025 r.</small>
                    </div>
                    <h2>{section.title}</h2>
                    <div className="reader-text">{renderStructuredText(section.body)}</div>
                  </section>
                  <section
                    className={`statute-version statute-version-proposed proposal-${proposal.kind}`}
                    aria-label={`Proponowane brzmienie ${proposal.title}`}
                  >
                    <div className="statute-version-heading">
                      <span>Proponowane brzmienie</span>
                      <small>{proposal.label}</small>
                    </div>
                    <h2>
                      {proposal.changed ? (
                        <DiffSegments segments={buildInlineDiff(section.title, proposal.title)} />
                      ) : (
                        proposal.title
                      )}
                    </h2>
                    <div className="reader-text">
                      {proposal.changed ? (
                        <StatuteDiffBody current={section.body} proposed={proposal.body} />
                      ) : (
                        renderStructuredText(proposal.body)
                      )}
                    </div>
                    {proposal.rationale ? <p className="statute-rationale">{proposal.rationale}</p> : null}
                  </section>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
