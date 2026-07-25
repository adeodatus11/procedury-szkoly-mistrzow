import Link from "next/link";
import { documentPackageHref, documentPackages } from "../document-packages";
import { formTemplates } from "../form-templates";

export const metadata = {
  title: "Paczki dokumentów ZIP | Procedury Szkoły Mistrzów",
};

export default function PackagesPage() {
  return (
    <main>
      <section className="packages-hero">
        <p className="eyebrow">Pliki do pobrania</p>
        <h1>Paczki wzorów dokumentów</h1>
        <p className="lead">
          Pobierz cały zestaw tematyczny w jednym pliku ZIP. Każda paczka zawiera edytowalne pliki Word i
          informację, że wzory wymagają weryfikacji przed zatwierdzeniem.
        </p>
        <div className="verification-banner">
          <strong>DO WERYFIKACJI</strong>
          <span>Paczki zawierają propozycje robocze, a nie obowiązujące wzory ZSZ nr 5.</span>
        </div>
        <div className="packages-summary">
          <div><strong>{documentPackages.length}</strong><span>paczek ZIP</span></div>
          <div><strong>{formTemplates.length}</strong><span>wzorów DOCX</span></div>
        </div>
      </section>
      <section className="packages-list" aria-label="Dostępne paczki">
        {documentPackages.map((item) => (
          <article className={`package-row${item.id === "wszystkie" ? " package-row-all" : ""}`} id={`package-${item.id}`} key={item.id}>
            <div>
              <span>{item.templateCount} {item.templateCount === 1 ? "plik" : "plików"} DOCX</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              {item.sourceDocumentId ? (
                <Link href={`/dokumenty/${item.sourceDocumentId}`}>{item.sourceDocumentTitle}</Link>
              ) : null}
            </div>
            <a className="primary-action" download href={documentPackageHref(item.filename)}>Pobierz ZIP</a>
          </article>
        ))}
      </section>
    </main>
  );
}
