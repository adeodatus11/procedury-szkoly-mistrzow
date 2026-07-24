import Link from "next/link";
import { documents, generatedAt, missingDocuments } from "../content";

function groupedMissing() {
  return missingDocuments.reduce<Record<string, typeof missingDocuments>>((groups, document) => {
    groups[document.category] = [...(groups[document.category] ?? []), document];
    return groups;
  }, {});
}

export default function MissingPage() {
  const groups = groupedMissing();
  const generatedDate = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(generatedAt));

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
            <Link href="/#statut">Statut</Link>
          </div>
        </nav>
      </header>

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
        </div>
      </section>

      <section className="share-note">
        <h2>Jak czytać tę listę</h2>
        <p>
          Każda pozycja zawiera nazwę dokumentu, typ, podstawę w statucie oraz krótkie uzasadnienie. Lista jest
          robocza i służy do zaplanowania przygotowania brakujących aktów wewnętrznych szkoły.
        </p>
        <p>Stan indeksu: {generatedDate}</p>
      </section>

      <section className="share-missing-list" aria-label="Brakujące dokumenty">
        {Object.entries(groups).map(([category, items]) => (
          <article className="share-group" key={category}>
            <div className="share-group-header">
              <h2>{category}</h2>
              <span>{items.length}</span>
            </div>
            <div className="share-items">
              {items.map((document, index) => (
                <section className="share-item" key={document.id}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{document.title}</h3>
                    <p>{document.note}</p>
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
