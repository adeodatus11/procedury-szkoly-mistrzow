"use client";

import { useMemo, useState } from "react";
import {
  documents,
  externalSources,
  generatedAt,
  missingDocuments,
  siteStats,
  statuteChapters,
  statuteSections,
} from "./content";
import { documentHref, includesQuery, statuteChapterHref, statusLabel } from "./content-utils";

const categories = [
  "Wszystko",
  "Statut",
  "Procedury",
  "Instrukcje",
  "Regulaminy",
  "Programy",
  "Ocenianie",
  "Braki",
] as const;

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Wszystko");

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesCategory =
        category === "Wszystko" ||
        category === document.category ||
        (category === "Programy" && document.category === "Programy");
      const haystack = `${document.title} ${document.category} ${document.status} ${document.statuteRefs.join(" ")} ${document.body}`;
      return matchesCategory && (!query || includesQuery(haystack, query));
    });
  }, [category, query]);

  const filteredSections = useMemo(() => {
    if (category !== "Wszystko" && category !== "Statut") return [];
    return statuteSections.filter((section) => {
      const haystack = `${section.title} ${section.chapter} ${section.body}`;
      return !query || includesQuery(haystack, query);
    });
  }, [category, query]);

  const filteredChapters = useMemo(() => {
    if (category !== "Wszystko" && category !== "Statut") return [];
    if (!query) return statuteChapters;
    const matchingChapterTitles = new Set(filteredSections.map((section) => section.chapter));
    return statuteChapters.filter((chapter) => matchingChapterTitles.has(chapter.title));
  }, [category, filteredSections, query]);

  const filteredMissing = useMemo(() => {
    if (category !== "Wszystko" && category !== "Braki") return [];
    return missingDocuments.filter((document) => {
      const haystack = `${document.title} ${document.category} ${document.ref} ${document.note}`;
      return !query || includesQuery(haystack, query);
    });
  }, [category, query]);

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
            <a href="./braki/">Braki</a>
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
              <strong>{siteStats.statuteChapterCount}</strong>
              <span>rozdziałów statutu</span>
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

      <section className="workspace workspace-single" id="dokumenty">
        <div className="document-list">
          <div className="section-heading">
            <p>Dokumenty zebrane</p>
            <h2>Rejestr dokumentów</h2>
          </div>
          <div className="list-stack">
            {filteredDocuments.map((document) => (
              <article className="doc-card" key={document.id}>
                <a className="card-cover-link" href={documentHref(document.id)} aria-label={`Czytaj: ${document.title}`} />
                <div className="doc-card-head">
                  <span className="pill">{document.category}</span>
                  <span className={`status status-${document.status.replaceAll(" ", "-")}`}>
                    {statusLabel(document.status)}
                  </span>
                </div>
                <h3>{document.title}</h3>
                <p>{document.excerpt}</p>
                {document.status === "propozycja" ? (
                  <div className="proposal-notice">
                    Propozycja robocza. Pełna treść jest na osobnej stronie dokumentu.
                  </div>
                ) : null}
                <div className="refs">
                  {document.statuteRefs.map((ref) => (
                    <span key={ref}>{ref}</span>
                  ))}
                </div>
                <div className="doc-actions">
                  <a className="read-link" href={documentHref(document.id)}>
                    Czytaj
                  </a>
                  {document.hasDownload && document.download ? <a href={document.download}>Pobierz</a> : null}
                </div>
              </article>
            ))}
            {!filteredDocuments.length ? <p className="empty">Brak dokumentów dla tego filtra.</p> : null}
          </div>
        </div>
      </section>

      <section className="statute-section" id="statut">
        <div className="section-heading">
          <p>Statut tekstowy</p>
          <h2>Statut podzielony na rozdziały</h2>
          <p className="section-lead">
            Każdy rozdział otwiera się jako osobna strona. Menu rozdziałów zostaje po lewej, a po prawej wyświetla
            się tylko jeden wybrany rozdział.
          </p>
        </div>
        <div className="reader-layout">
          <aside className="reader-toc" aria-label="Spis treści statutu">
            <div className="reader-toc-header">
              <strong>{filteredChapters.length}</strong>
              <span>{query ? "rozdziałów z trafieniami" : "rozdziałów"}</span>
            </div>
            <a className="reader-download" href={siteStats.statuteDownload}>
              Pobierz oryginalny PDF
            </a>
            <nav>
              {filteredChapters.map((chapter) => (
                <a href={statuteChapterHref(chapter.id)} key={chapter.id}>
                  {chapter.title}
                </a>
              ))}
            </nav>
          </aside>
          <div className="statute-reader">
            {filteredChapters.slice(0, 1).map((chapter) => (
              <article className="reader-article chapter-teaser" key={chapter.id}>
                <span>Podgląd</span>
                <h3>{chapter.title}</h3>
                <p>
                  Otwórz rozdział, żeby czytać statut w osobnym, krótszym widoku bez ładowania całego tekstu naraz.
                </p>
                <a className="section-link" href={statuteChapterHref(chapter.id)}>
                  Otwórz rozdział
                </a>
              </article>
            ))}
            {!filteredChapters.length ? <p className="empty">Brak rozdziałów statutu dla tego filtra.</p> : null}
          </div>
        </div>
      </section>

      <section className="missing-section" id="braki">
        <div className="section-heading">
          <p>Do opracowania</p>
          <h2>Dokumenty wskazane przez statut, których brakuje w katalogu</h2>
          <a className="section-link" href="./braki/">
            Otwórz osobną stronę z brakami
          </a>
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
