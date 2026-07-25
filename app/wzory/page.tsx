import Link from "next/link";
import { FormTemplateQuickEntry } from "../form-template-quick-entry";
import { formTemplateGroups, formTemplates } from "../form-templates";

export const metadata = {
  title: "Wzory pism i formularzy | Procedury Szkoły Mistrzów",
};

export default function FormTemplatesPage() {
  const previewPageCount = formTemplates.reduce((total, template) => total + template.pageCount, 0);

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
            <Link href="/braki">Braki</Link>
          </div>
        </nav>
      </header>

      <section className="forms-hero">
        <p className="eyebrow">Materiały robocze ZSZ nr 5</p>
        <h1>Wzory pism i formularzy</h1>
        <p className="lead">
          Zestaw propozycji przygotowanych do procedur i instrukcji. Każdy wzór ma podgląd wszystkich stron,
          bezpośredni plik Word oraz wykaz źródeł wykorzystanych w kwerendzie.
        </p>
        <div className="verification-banner">
          <strong>DO WERYFIKACJI</strong>
          <span>
            Wzory nie są obowiązującymi dokumentami szkoły. Przed użyciem wymagają zatwierdzenia i dostosowania
            do konkretnej sprawy.
          </span>
        </div>
        <div className="forms-summary" aria-label="Podsumowanie wzorów">
          <div>
            <strong>{formTemplates.length}</strong>
            <span>wzorów DOCX</span>
          </div>
          <div>
            <strong>{formTemplateGroups.length}</strong>
            <span>pakietów tematycznych</span>
          </div>
          <div>
            <strong>{previewPageCount}</strong>
            <span>stron podglądu</span>
          </div>
        </div>
      </section>

      <section className="forms-index" aria-label="Katalog wzorów">
        {formTemplateGroups.map((group) => (
          <article className="forms-group" id={group.id} key={group.id}>
            <header className="forms-group-header">
              <div>
                <p>{group.title}</p>
                <h2>{group.sourceDocumentTitle}</h2>
              </div>
              <Link href={`/dokumenty/${group.sourceDocumentId}`}>Otwórz dokument źródłowy</Link>
            </header>
            <div className="forms-list">
              {group.templates.map((template, index) => (
                <FormTemplateQuickEntry index={index} key={template.id} template={template} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
