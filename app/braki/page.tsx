import Link from "next/link";
import { documents, generatedAt, missingDocuments } from "../content";
import { documentHref } from "../content-utils";
import { formTemplateHref, formTemplates, templateForMissingDocument } from "../form-templates";

function groupedMissing() {
  return missingDocuments.reduce<Record<string, (typeof missingDocuments)[number][]>>((groups, document) => {
    groups[document.category] = [...(groups[document.category] ?? []), document];
    return groups;
  }, {});
}

export default function MissingPage() {
  const groups = groupedMissing();
  const proposalDocuments = documents.filter((document) => document.status === "propozycja");
  const generatedDate = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(generatedAt));

  return (
    <main>
      <section className="share-hero">
        <p className="eyebrow">Lista do przekazania</p>
        <h1>Braki w dokumentacji statutowej</h1>
        <p className="lead">
          Zestawienie dokumentów, procedur, instrukcji i rejestrów, które wynikają ze statutu albo są potrzebne
          do jego praktycznego stosowania, ale nie są jeszcze włączone do katalogu dokumentów.
        </p>
        <div className="share-summary" aria-label="Podsumowanie listy braków">
          <div>
            <strong>{missingDocuments.length}</strong>
            <span>dokumentów do opracowania</span>
          </div>
          <div>
            <strong>{Object.keys(groups).length}</strong>
            <span>kategorii</span>
          </div>
          <div>
            <strong>{documents.length}</strong>
            <span>dokumentów już zebranych</span>
          </div>
          <div>
            <strong>{formTemplates.length}</strong>
            <span>wzorów do weryfikacji</span>
          </div>
        </div>
      </section>

      <section className="share-note">
        <h2>Jak czytać tę listę</h2>
        <p>
          Każda pozycja zawiera nazwę dokumentu, typ, podstawę w statucie oraz krótkie uzasadnienie. Lista jest
          robocza i służy do zaplanowania przygotowania brakujących aktów wewnętrznych szkoły. Jeżeli dla danego
          obszaru powstała już propozycja robocza, prowadzi do niej osobny odnośnik poniżej.
        </p>
        <p>Stan indeksu: {generatedDate}</p>
      </section>

      {proposalDocuments.length ? (
        <section className="proposal-index" aria-label="Propozycje dokumentów">
          <div className="section-heading">
            <p>Propozycje robocze</p>
            <h2>Dokumenty, dla których przygotowano propozycję</h2>
          </div>
          <div className="proposal-grid">
            {proposalDocuments.map((document) => (
              <a className="proposal-card" href={documentHref(document.id)} key={document.id}>
                <span>{document.category}</span>
                <h3>{document.title}</h3>
                <p>Jest propozycja robocza do sprawdzenia i dalszej pracy.</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="share-missing-list" aria-label="Brakujące dokumenty">
        {Object.entries(groups).map(([category, items]) => (
          <article className="share-group" key={category}>
            <div className="share-group-header">
              <h2>{category}</h2>
              <span>{items.length}</span>
            </div>
            <div className="share-items">
              {items.map((document, index) => (
                <section className="share-item" id={document.id} key={document.id}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{document.title}</h3>
                    <p>{document.note}</p>
                    {templateForMissingDocument(document.id) ? (
                      <Link
                        className="missing-proposal-link"
                        href={formTemplateHref(templateForMissingDocument(document.id)!.id)}
                      >
                        Jest propozycja wzoru - otwórz podgląd i plik Word
                      </Link>
                    ) : null}
                  </div>
                  <strong>{document.ref}</strong>
                </section>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
