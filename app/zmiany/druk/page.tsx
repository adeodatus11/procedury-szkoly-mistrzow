import { getStructuredLineClassName } from "../../content-utils";
import { StatuteMajorChangeJustification } from "../../statute-major-change-justification";
import { buildInlineDiff, buildTextDiff } from "../../statute-diff.mjs";
import { statuteProposalMeta } from "../../statute-proposals";
import { statuteChangeEntries } from "../../statute-change-register";
import { PrintPageButton } from "../../print-page-button";

export const metadata = {
  title: "Wykaz proponowanych zmian statutu ZSZ nr 5",
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

function DiffBody({ current, proposed }: { current: string; proposed: string }) {
  return buildTextDiff(current, proposed).map((line, index) => (
    <p className={`${getStructuredLineClassName(line.source)} statute-diff-line`} key={`${line.source}-${index}`}>
      <DiffSegments segments={line.segments} />
    </p>
  ));
}

export default function PrintableChangesPage() {
  return (
    <main className="print-report">
      <header className="print-report-header">
        <p>Zespół Szkół Zawodowych nr 5 we Wrocławiu</p>
        <h1>Wykaz proponowanych zmian statutu</h1>
        <span>Stan kwerendy: {statuteProposalMeta.asOf}</span>
        <strong>PROPOZYCJA ROBOCZA DO WERYFIKACJI</strong>
        <PrintPageButton />
      </header>
      <section className="print-report-notice">
        <p>{statuteProposalMeta.notice}</p>
        <p>{statuteProposalMeta.method}</p>
      </section>
      {statuteChangeEntries.map((entry, index) => (
        <article className="print-change" id={`change-${entry.id}`} key={entry.id}>
          <div className="print-change-heading">
            <span>Zmiana {index + 1} z {statuteChangeEntries.length}</span>
            <strong>{entry.chapterTitle}</strong>
            <small>{entry.label}</small>
          </div>
          <div className="print-change-columns">
            <section className="statute-version statute-version-current">
              <div className="statute-version-heading"><span>Aktualne brzmienie</span></div>
              <h2>{entry.currentTitle}</h2>
              <div className="reader-text">
                {entry.currentBody.split(/\n{2,}/).map((block) => (
                  <p className={getStructuredLineClassName(block)} key={block}>{block}</p>
                ))}
              </div>
            </section>
            <section className={`statute-version statute-version-proposed proposal-${entry.kind}`}>
              <div className="statute-version-heading"><span>Proponowane brzmienie</span></div>
              <h2><DiffSegments segments={buildInlineDiff(entry.currentTitle, entry.proposedTitle)} /></h2>
              <div className="reader-text"><DiffBody current={entry.currentBody} proposed={entry.proposedBody} /></div>
              <p className="statute-rationale">{entry.rationale}</p>
            </section>
          </div>
          <StatuteMajorChangeJustification context={entry.majorChange} />
        </article>
      ))}
    </main>
  );
}
