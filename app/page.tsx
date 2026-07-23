"use client";

import { useMemo, useState } from "react";
import {
  documents,
  externalSources,
  generatedAt,
  missingDocuments,
  siteStats,
  statuteSections,
} from "./content";

const categories = [
  "Wszystko",
  "Statut",
  "Procedury",
  "Regulaminy",
  "Programy",
  "Ocenianie",
  "Braki",
] as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function includesQuery(value: string, query: string) {
  return normalize(value).includes(normalize(query));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    obowiazujacy: "obowiązujący",
    gotowy: "gotowy",
    "do uzupelnienia": "do uzupełnienia",
    brak: "brak",
  };
  return labels[status] ?? status;
}

function compactBody(value: string, limit = 900) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Wszystko");
  const [selectedDocumentId, setSelectedDocumentId] = useState(documents[0].id);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesCategory =
        category === "Wszystko" ||
        category === document.category ||
        (category === "Programy" && document.category === "Programy");
      const haystack = `${document.title} ${document.category} ${document.status} ${document.statuteRefs.join(" ")} ${document.body}`;
      const matchesQuery = !query || includesQuery(haystack, query);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const filteredSections = useMemo(() => {
    if (category !== "Wszystko" && category !== "Statut") return [];
    return statuteSections.filter((section) => {
      const haystack = `${section.title} ${section.chapter} ${section.body}`;
      return !query || includesQuery(haystack, query);
    });
  }, [category, query]);

  const filteredMissing = useMemo(() => {
    if (category !== "Wszystko" && category !== "Braki") return [];
    return missingDocuments.filter((document) => {
      const haystack = `${document.title} ${document.category} ${document.ref} ${document.note}`;
      return !query || includesQuery(haystack, query);
    });
  }, [category, query]);

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ??
    filteredDocuments[0] ??
    documents[0];

  const updateSelection = (id: string) => {
    setSelectedDocumentId(id);
    document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const generatedDate = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(generatedAt));

  return (
    <main>
      <header className="site-header">
        <nav className="topbar" aria-label="Główna nawigacja">
          <a className="brand" href="#start">
            <img src="/assets/logo.png" alt="procedury.szkolamistrzow.info" />
          </a>
          <div className="topbar-links">
            <a href="#dokumenty">Dokumenty</a>
            <a href="#statut">Statut</a>
            <a href="#braki">Braki</a>
            <a href="#zrodla">Źródła</a>
          </div>
        </nav>

        <section className="hero" id="start">
          <div className="hero-copy">
            <p className="eyebrow">System dokumentacji ZSZ nr 5</p>
            <h1>Statut, procedury i regulaminy w jednym miejscu</h1>
            <p className="lead">
              Prosty katalog dokumentów wynikających ze Statutu Zespołu Szkół Zawodowych nr 5 we Wrocławiu.
              Strona używa aktualnego statutu z 15 października 2025 r. jako dokumentu nadrzędnego.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href={siteStats.statuteDownload}>
                Pobierz statut PDF
              </a>
              <a className="secondary-action" href="#wyszukiwarka">
                Przejdź do wyszukiwarki
              </a>
            </div>
          </div>
          <aside className="hero-status" aria-label="Stan katalogu">
            <div>
              <strong>{siteStats.documentCount}</strong>
              <span>dokumentów</span>
            </div>
            <div>
              <strong>{siteStats.statuteSectionCount}</strong>
              <span>sekcji statutu</span>
            </div>
            <div>
              <strong>{siteStats.missingCount}</strong>
              <span>braków do opracowania</span>
            </div>
          </aside>
        </section>
      </header>

      <section className="search-band" id="wyszukiwarka">
        <div className="search-inner">
          <label htmlFor="search">Wyszukaj w statucie i dokumentach</label>
          <div className="search-row">
            <input
              id="search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="np. skreślenie, dyżury, pomoc psychologiczno-pedagogiczna, wycieczki"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")}>
                Wyczyść
              </button>
            ) : null}
          </div>
          <div className="filters" aria-label="Filtry">
            {categories.map((item) => (
              <button
                className={category === item ? "active" : ""}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard" aria-label="Podsumowanie wyników">
        <div>
          <span>{filteredDocuments.length}</span>
          <p>dokumentów w widoku</p>
        </div>
        <div>
          <span>{filteredSections.length}</span>
          <p>trafień w statucie</p>
        </div>
        <div>
          <span>{filteredMissing.length}</span>
          <p>braków w kolejce</p>
        </div>
        <div>
          <span>{generatedDate}</span>
          <p>ostatnia aktualizacja indeksu</p>
        </div>
      </section>

      <section className="workspace" id="dokumenty">
        <div className="document-list">
          <div className="section-heading">
            <p>Dokumenty zebrane</p>
            <h2>Rejestr dokumentów</h2>
          </div>
          <div className="list-stack">
            {filteredDocuments.map((document) => (
              <article className="doc-card" key={document.id}>
                <div className="doc-card-head">
                  <span className="pill">{document.category}</span>
                  <span className={`status status-${document.status.replaceAll(" ", "-")}`}>
                    {statusLabel(document.status)}
                  </span>
                </div>
                <h3>{document.title}</h3>
                <p>{document.excerpt}</p>
                <div className="refs">
                  {document.statuteRefs.map((ref) => (
                    <span key={ref}>{ref}</span>
                  ))}
                </div>
                <div className="doc-actions">
                  <button type="button" onClick={() => updateSelection(document.id)}>
                    Czytaj
                  </button>
                  {document.hasDownload && document.download ? (
                    <a href={document.download}>Pobierz</a>
                  ) : null}
                </div>
              </article>
            ))}
            {!filteredDocuments.length ? <p className="empty">Brak dokumentów dla tego filtra.</p> : null}
          </div>
        </div>

        <aside className="preview" id="preview">
          <div className="preview-header">
            <span className="pill">{selectedDocument.category}</span>
            <h2>{selectedDocument.title}</h2>
            <p>
              Podstawa w statucie: <strong>{selectedDocument.statuteRefs.join(", ")}</strong>
            </p>
            {selectedDocument.hasDownload && selectedDocument.download ? (
              <a className="download-link" href={selectedDocument.download}>
                Pobierz plik źródłowy
              </a>
            ) : null}
          </div>
          <pre>{compactBody(selectedDocument.body, selectedDocument.id === "statut" ? 2200 : 1800)}</pre>
        </aside>
      </section>

      <section className="statute-section" id="statut">
        <div className="section-heading">
          <p>Statut jako mapa</p>
          <h2>Wyniki w aktualnym statucie</h2>
        </div>
        <div className="statute-grid">
          {filteredSections.slice(0, 36).map((section) => (
            <article className="statute-card" key={section.id}>
              <span>{section.chapter}</span>
              <h3>{section.title}</h3>
              <p>{compactBody(section.body, 360)}</p>
            </article>
          ))}
        </div>
        {filteredSections.length > 36 ? (
          <p className="more-note">
            Pokazuję pierwsze 36 trafień. Doprecyzuj zapytanie, żeby zawęzić listę.
          </p>
        ) : null}
      </section>

      <section className="missing-section" id="braki">
        <div className="section-heading">
          <p>Do opracowania</p>
          <h2>Dokumenty wskazane przez statut, których brakuje w katalogu</h2>
        </div>
        <div className="missing-list">
          {filteredMissing.map((document) => (
            <article className="missing-item" key={document.id}>
              <div>
                <span className="pill">{document.category}</span>
                <h3>{document.title}</h3>
                <p>{document.note}</p>
              </div>
              <strong>{document.ref}</strong>
            </article>
          ))}
          {!filteredMissing.length ? <p className="empty">Brak pozycji dla tego filtra.</p> : null}
        </div>
      </section>

      <section className="sources-section" id="zrodla">
        <div className="section-heading">
          <p>Źródła zewnętrzne</p>
          <h2>Akty prawne i odwołania</h2>
        </div>
        <div className="source-list">
          {externalSources.map((source) => (
            <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
              {source.title}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
