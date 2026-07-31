import { notFound } from "next/navigation";
import { documents } from "../../content";
import { renderStructuredText, statusLabel } from "../../content-utils";
import { FormTemplateQuickEntry } from "../../form-template-quick-entry";
import { templatesForDocument } from "../../form-templates";

const documentAttachments: Record<string, Array<{ href: string; label: string; note: string }>> = {
  "ins-kancelaryjna-propozycja": [
    {
      href: "/docs/instrukcje/INS_01_Schemat_obiegu_dokumentow.svg",
      label: "Schemat obiegu dokumentów",
      note: "Grafika SVG pokazująca obieg dokumentów przychodzących, wychodzących i sekretariatu uczniowskiego.",
    },
    {
      href: "/docs/ewidencja/Ewidencja_dokumentow_ZSZ5.xlsx",
      label: "Ewidencja dokumentów ZSZ5",
      note: "Skoroszyt Excel z rejestrem dokumentów przychodzących i wychodzących/wytworzonych.",
    },
    {
      href: "/docs/ewidencja/jednolity_wykaz_akt_UMWroc.xlsx",
      label: "Jednolity wykaz akt",
      note: "Roboczy słownik klasyfikacyjny użyty w ewidencji dokumentów.",
    },
  ],
};

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
  const attachments = documentAttachments[document.id] ?? [];
  const hasRelatedContent = relatedTemplates.length || attachments.length;
  const { beforeSources, sources } = hasRelatedContent
    ? splitBodyAtSources(document.body)
    : { beforeSources: document.body, sources: "" };

  return (
    <main>
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
            {hasRelatedContent ? (
              <a className="related-forms-jump" href="#zalaczniki">
                {attachments.length ? "Przejdź do załączników" : "Przejdź do wzorów"}
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
              {hasRelatedContent ? (
                <section
                  className="related-forms related-forms-inline"
                  aria-label="Załączniki do dokumentu"
                  id="zalaczniki"
                >
                  <div className="section-heading">
                    <p>Załączniki robocze</p>
                    <h2>Podgląd i pliki do pobrania</h2>
                  </div>
                  {attachments.length ? (
                    <div className="document-attachments">
                      {attachments.map((attachment) => (
                        <a className="document-attachment" href={attachment.href} key={attachment.href}>
                          <strong>{attachment.label}</strong>
                          <span>{attachment.note}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {relatedTemplates.length ? (
                    <div className="related-forms-list">
                      {relatedTemplates.map((template) => (
                        <FormTemplateQuickEntry
                          key={template.id}
                          template={template}
                          variant="compact"
                        />
                      ))}
                    </div>
                  ) : null}
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
