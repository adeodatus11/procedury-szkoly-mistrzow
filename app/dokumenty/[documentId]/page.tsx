import { notFound } from "next/navigation";
import { documents } from "../../content";
import { renderStructuredText, statusLabel } from "../../content-utils";

type PageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

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

  return (
    <main>
      <header className="site-header">
        <nav className="topbar" aria-label="Główna nawigacja">
          <a className="brand" href="/">
            <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
          </a>
          <div className="topbar-links">
            <a href="/">Strona główna</a>
            <a href="/#dokumenty">Dokumenty</a>
            <a href="/statut">Statut</a>
            <a href="/braki">Braki</a>
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
            <div className="document-reader document-reader-full">{renderStructuredText(document.body)}</div>
          </article>
        </div>
      </section>
    </main>
  );
}
