import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formTemplates,
  formTemplateHref,
  templatesForDocument,
} from "../../form-templates";

type PageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export function generateStaticParams() {
  return formTemplates.map((template) => ({
    templateId: template.id,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { templateId } = await params;
  const template = formTemplates.find((item) => item.id === templateId);

  return {
    title: template
      ? `${template.title} | Wzory dokumentów ZSZ nr 5`
      : "Wzór dokumentu | Procedury Szkoły Mistrzów",
  };
}

export default async function FormTemplatePage({ params }: PageProps) {
  const { templateId } = await params;
  const template = formTemplates.find((item) => item.id === templateId);
  if (!template) notFound();

  const siblings = templatesForDocument(template.sourceDocumentId);

  return (
    <main>
      <header className="site-header">
        <nav className="topbar" aria-label="Główna nawigacja">
          <Link className="brand" href="/">
            <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
          </Link>
          <div className="topbar-links">
            <Link href="/">Strona główna</Link>
            <Link href="/wzory">Wszystkie wzory</Link>
            <Link href={`/dokumenty/${template.sourceDocumentId}`}>Dokument źródłowy</Link>
            <Link href="/braki">Braki</Link>
          </div>
        </nav>
      </header>

      <section className="form-detail">
        <aside className="form-detail-meta" aria-label="Informacje o wzorze">
          <span className="status status-propozycja">propozycja</span>
          <strong>{template.code}</strong>
          <div>
            <p>Pakiet</p>
            <span>{template.groupTitle}</span>
          </div>
          <div>
            <p>Liczba stron</p>
            <span>{template.pageCount}</span>
          </div>
          <a className="primary-action" href={template.downloadUrl} download>
            Pobierz plik Word
          </a>
          <Link className="secondary-action" href={`/dokumenty/${template.sourceDocumentId}`}>
            Czytaj procedurę lub instrukcję
          </Link>
        </aside>

        <article className="form-detail-main">
          <p className="eyebrow">{template.sourceDocumentTitle}</p>
          <h1>{template.title}</h1>
          <p className="lead">{template.summary}</p>
          <div className="verification-banner verification-banner-strong">
            <strong>DO WERYFIKACJI</strong>
            <span>
              To propozycja tego, jak dokument może wyglądać. Nie jest jeszcze obowiązującym wzorem ZSZ nr 5 i
              wymaga sprawdzenia merytorycznego, prawnego oraz zatwierdzenia przez dyrektora.
            </span>
          </div>

          <section className="preview-section" aria-label="Podgląd dokumentu">
            <div className="section-heading">
              <p>Szybki podgląd</p>
              <h2>Wszystkie strony dokumentu</h2>
            </div>
            <div className="preview-pages">
              {template.previewPages.map((page, index) => (
                <figure className="preview-page" key={page}>
                  <img
                    src={page}
                    alt={`${template.title} - podgląd strony ${index + 1} z ${template.pageCount}`}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <figcaption>
                    Strona {index + 1} z {template.pageCount}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section className="research-section">
            <div className="section-heading">
              <p>Kwerenda</p>
              <h2>Podstawa opracowania</h2>
            </div>
            <p>
              Zakres pól wzoru opracowano na podstawie niżej wskazanych przepisów, materiałów urzędowych i
              przykładów szkolnych. Źródła służą do weryfikacji projektu, nie zastępują analizy konkretnej sprawy.
            </p>
            <div className="research-links">
              {template.sources.map((source) => (
                <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
                  {source.label}
                </a>
              ))}
            </div>
          </section>

          <nav className="sibling-forms" aria-label="Pozostałe wzory w pakiecie">
            <h2>Pozostałe wzory w tym pakiecie</h2>
            {siblings.map((item) => (
              <Link
                className={item.id === template.id ? "active" : ""}
                href={formTemplateHref(item.id)}
                key={item.id}
              >
                <span>{item.code}</span>
                {item.title}
              </Link>
            ))}
          </nav>
        </article>
      </section>
    </main>
  );
}
