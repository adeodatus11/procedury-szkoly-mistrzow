import Link from "next/link";
import { notFound } from "next/navigation";
import { documents } from "../../content";
import { renderStructuredText, statusLabel } from "../../content-utils";
import { FormTemplateQuickEntry } from "../../form-template-quick-entry";
import { templatesForDocument } from "../../form-templates";

type PageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

function splitBodyAtSources(body: string) {
  const sourcesHeading = /\n(?=\s*\d+\.\s+Źródła wykorzystane w kwerendzie)/i;
  const match = sourcesHeading.exec(body);

  if (match?.index === undefined) {
    return { beforeSources: body, sources: "" };
  }

  return {
    beforeSources: body.slice(0, match.index).trimEnd(),
    sources: body.slice(match.index).trimStart(),
  };
}

export function generateStaticParams() {
  return documents.map((document) => ({
    documentId: document.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { documentId } = await params;
  const document = documents.find((item) => item.id === documentId);

  return {
    title: document ? `${document.title} | Procedury Szkoły Mistrzów` : "Dokument | Procedury Szkoły Mistrzów",
  };
}

export default async function DocumentPage({ params }: PageProps) {
  const { documentId } = await params;
  const document = documents.find((item) => item.id === documentId);

  if (!document) notFound();
  const relatedTemplates = templatesForDocument(document.id);
  const { beforeSources, sources } = relatedTemplates.length
    ? splitBodyAtSources(document.body)
    : { beforeSources: document.body, sources: "" };

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

      <section className="document-page">
        <div className="document-shell">
          <aside className="document-meta" aria-label="Informacje o dokumencie">
            <span className="pill">{document.category}</span>
            <span className={`status status-${document.status.replaceAll(" ", "-")}`}>
              {statusLabel(document.status)}
            </span>
            <div>
              <p>Podstawa w statucie</p>
              <strong>{document.statuteRefs.join(", ")}</strong>
            </div>
            {relatedTemplates.length ? (
              <a className="related-forms-jump" href="#zalaczniki">
                Przejdź do wzorów
              </a>
            ) : null}
            {document.hasDownload && document.download ? (
              <a className="download-link" href={document.download}>
                Pobierz plik źródłowy
              </a>
            ) : null}
          </aside>

          <article className="document-full">
            <h1>{document.title}</h1>
            {document.status === "propozycja" ? (
              <div className="proposal-notice">
                To jest propozycja robocza przygotowana na podstawie kwerendy. Nie jest jeszcze aktem obowiązującym
                szkoły i wymaga konfrontacji z dokumentami ZSZ nr 5 oraz weryfikacji prawnej.
              </div>
            ) : null}
            <div className="document-reader document-reader-full">
              {renderStructuredText(beforeSources)}
              {relatedTemplates.length ? (
                <section
                  className="related-forms related-forms-inline"
                  aria-label="Wzory pism do dokumentu"
                  id="zalaczniki"
                >
                  <div className="section-heading">
                    <p>Załączniki robocze</p>
                    <h2>Podgląd i pliki do pobrania</h2>
                  </div>
                  <div className="related-forms-list">
                    {relatedTemplates.map((template) => (
                      <FormTemplateQuickEntry
                        key={template.id}
                        template={template}
                        variant="compact"
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {sources ? (
                <div className="document-reader-continuation">
                  {renderStructuredText(sources)}
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
