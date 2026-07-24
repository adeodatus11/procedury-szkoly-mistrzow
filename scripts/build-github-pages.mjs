import fs from "node:fs";
import path from "node:path";

const siteRoot = process.cwd();
const outputDir = path.join(siteRoot, "_site");
const publicDir = path.join(siteRoot, "public");
const dataPath = path.join(publicDir, "search-data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(source, target) {
  ensureDir(target);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(sourcePath, targetPath);
    else fs.copyFileSync(sourcePath, targetPath);
  }
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function statusLabel(status) {
  return (
    {
      obowiazujacy: "obowiązujący",
      gotowy: "gotowy",
      "do uzupelnienia": "do uzupełnienia",
      propozycja: "propozycja",
      brak: "brak",
    }[status] || status
  );
}

function relativePrefix(depth) {
  return depth === 0 ? "./" : "../".repeat(depth);
}

function docHref(document, prefix) {
  return `${prefix}dokumenty/${document.id}/`;
}

function chapterHref(chapter, prefix) {
  return `${prefix}statut/${chapter.id}/`;
}

function fileHref(url, prefix) {
  return `${prefix}${String(url).replace(/^\//, "")}`;
}

function sourceUrl(title) {
  return data.externalSources.find((source) => normalize(source.title) === normalize(title))?.url || "#zrodla";
}

const legalReferences = [
  { url: sourceUrl("Prawo oswiatowe"), phrases: ["Prawo oświatowe", "Prawa oświatowego"] },
  { url: sourceUrl("Ustawa o systemie oswiaty"), phrases: ["ustawa o systemie oświaty", "ustawy o systemie oświaty"] },
  {
    url: sourceUrl("Kodeks postepowania administracyjnego"),
    phrases: ["Kodeks postępowania administracyjnego", "Kodeksu postępowania administracyjnego"],
  },
  {
    url: sourceUrl("Pomoc psychologiczno-pedagogiczna"),
    phrases: ["pomoc psychologiczno-pedagogiczna", "pomocy psychologiczno-pedagogicznej"],
  },
  { url: sourceUrl("Indywidualne nauczanie"), phrases: ["indywidualne nauczanie", "indywidualnego nauczania"] },
  {
    url: sourceUrl("Dokumentacja przebiegu nauczania"),
    phrases: ["dokumentacja przebiegu nauczania", "dokumentacji przebiegu nauczania"],
  },
  {
    url: sourceUrl("Kwalifikacyjne kursy zawodowe"),
    phrases: ["kwalifikacyjny kurs zawodowy", "kwalifikacyjnego kursu zawodowego", "kwalifikacyjnych kursów zawodowych"],
  },
  { url: sourceUrl("Krajoznawstwo i turystyka"), phrases: ["krajoznawstwo i turystyka", "krajoznawstwa i turystyki"] },
  { url: sourceUrl("Praktyczna nauka zawodu"), phrases: ["praktyczna nauka zawodu", "praktycznej nauki zawodu"] },
  { url: sourceUrl("BHP w szkolach"), phrases: ["bezpieczeństwa i higieny pracy", "BHP"] },
  { url: sourceUrl("Ochrona maloletnich"), phrases: ["Standardy Ochrony Małoletnich", "ochrony małoletnich"] },
];

const legalMatcher = new RegExp(
  `(${legalReferences
    .flatMap((reference) => reference.phrases)
    .sort((a, b) => b.length - a.length)
    .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "gi",
);

function linkedText(value) {
  return esc(value)
    .split(legalMatcher)
    .map((part) => {
      const reference = legalReferences.find((item) => item.phrases.some((phrase) => normalize(phrase) === normalize(part)));
      if (!reference) return part;
      return `<a class="legal-link" href="${esc(reference.url)}" rel="noreferrer" target="_blank">${part}</a>`;
    })
    .join("");
}

function lineClassName(line) {
  const trimmed = line.trim();
  if (/^Rozdział\s+\d+/i.test(trimmed)) return "structured-line line-chapter";
  if (/^§\s*\d+/.test(trimmed)) return "structured-line line-paragraph";
  if (/^\d+[a-z]?\./i.test(trimmed)) return "structured-line line-ustep";
  if (/^\d+\)/.test(trimmed) || /^[-•]/.test(trimmed)) return "structured-line line-punkt";
  if (/^[a-z]\)/i.test(trimmed)) return "structured-line line-litera";
  if (/^https?:\/\//.test(trimmed)) return "structured-line line-source";
  return "structured-line";
}

function structuredHtml(value) {
  return String(value)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p class="${lineClassName(block)}">${linkedText(block)}</p>`)
    .join("");
}

function shell({ title, description, depth = 0, body }) {
  const prefix = relativePrefix(depth);
  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="icon" href="${prefix}assets/logo.png">
    <link rel="stylesheet" href="${prefix}styles.css">
  </head>
  <body>${body}</body>
</html>`;
}

function topbar(prefix, current = "") {
  return `<header class="site-header">
    <nav class="topbar" aria-label="Główna nawigacja">
      <a class="brand" href="${prefix}"><img src="${prefix}assets/logo.png" alt="procedury.szkolamistrzow.info"></a>
      <div class="topbar-links">
        <a href="${prefix}">Strona główna</a>
        <a href="${prefix}#dokumenty">Dokumenty</a>
        <a href="${prefix}statut/"${current === "statut" ? ' aria-current="page"' : ""}>Statut</a>
        <a href="${prefix}braki/"${current === "braki" ? ' aria-current="page"' : ""}>Braki</a>
      </div>
    </nav>
  </header>`;
}

function groupedMissing() {
  return data.missingDocuments.reduce((groups, document) => {
    groups[document.category] = [...(groups[document.category] || []), document];
    return groups;
  }, {});
}

fs.rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);
copyDir(path.join(publicDir, "assets"), path.join(outputDir, "assets"));
copyDir(path.join(publicDir, "docs"), path.join(outputDir, "docs"));
fs.writeFileSync(path.join(outputDir, ".nojekyll"), "");

const generatedDate = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(
  new Date(data.generatedAt),
);
const proposalDocuments = data.documents.filter((document) => document.status === "propozycja");

const indexHtml = shell({
  title: "Procedury Szkoły Mistrzów",
  description: "Statut, procedury, regulaminy i dokumenty Zespołu Szkół Zawodowych nr 5 we Wrocławiu.",
  body: `<main>
    <header class="site-header">
      <nav class="topbar" aria-label="Główna nawigacja">
        <a class="brand" href="#start"><img src="./assets/logo.png" alt="procedury.szkolamistrzow.info"></a>
        <div class="topbar-links">
          <a href="#dokumenty">Dokumenty</a>
          <a href="#statut">Statut</a>
          <a href="./braki/">Braki</a>
          <a href="#zrodla">Źródła</a>
        </div>
      </nav>
      <section class="hero" id="start">
        <div class="hero-copy">
          <p class="eyebrow">System dokumentacji ZSZ nr 5</p>
          <h1>Statut, procedury i regulaminy w jednym miejscu</h1>
          <p class="lead">Prosty katalog dokumentów wynikających ze Statutu Zespołu Szkół Zawodowych nr 5 we Wrocławiu. Strona używa aktualnego statutu z 15 października 2025 r. jako dokumentu nadrzędnego.</p>
          <div class="hero-actions">
            <a class="primary-action" href="./docs/Statut_Zespolu_Szkol_Zawodowych_nr_20251015.pdf">Pobierz statut PDF</a>
            <a class="secondary-action" href="#wyszukiwarka">Przejdź do wyszukiwarki</a>
          </div>
        </div>
        <aside class="hero-status" aria-label="Stan katalogu">
          <div><strong>${data.siteStats.documentCount}</strong><span>dokumentów</span></div>
          <div><strong>${data.siteStats.statuteChapterCount}</strong><span>rozdziałów statutu</span></div>
          <div><strong>${data.siteStats.missingCount}</strong><span>braków do opracowania</span></div>
        </aside>
      </section>
    </header>

    <section class="search-band" id="wyszukiwarka">
      <div class="search-inner">
        <label for="search">Wyszukaj w statucie i dokumentach</label>
        <div class="search-row">
          <input id="search" type="search" placeholder="np. skreślenie, dyżury, pomoc psychologiczno-pedagogiczna, wycieczki">
          <button id="clear" type="button">Wyczyść</button>
        </div>
        <div class="filters" aria-label="Filtry">
          ${["Wszystko", "Statut", "Procedury", "Instrukcje", "Regulaminy", "Programy", "Ocenianie", "Braki"]
            .map((item) => `<button type="button" data-filter="${esc(item)}">${esc(item)}</button>`)
            .join("")}
        </div>
      </div>
    </section>

    <section class="dashboard" aria-label="Podsumowanie wyników">
      <div><span id="count-docs">0</span><p>dokumentów w widoku</p></div>
      <div><span id="count-statut">0</span><p>trafień w statucie</p></div>
      <div><span id="count-braki">0</span><p>braków w kolejce</p></div>
      <div><span>${esc(generatedDate)}</span><p>ostatnia aktualizacja indeksu</p></div>
    </section>

    <section class="workspace workspace-single" id="dokumenty">
      <div class="document-list">
        <div class="section-heading"><p>Dokumenty zebrane</p><h2>Rejestr dokumentów</h2></div>
        <div class="list-stack" id="document-list"></div>
      </div>
    </section>

    <section class="statute-section" id="statut">
      <div class="section-heading">
        <p>Statut tekstowy</p>
        <h2>Statut podzielony na rozdziały</h2>
        <p class="section-lead">Każdy rozdział otwiera się jako osobna strona. Menu rozdziałów zostaje po lewej, a po prawej wyświetla się tylko jeden wybrany rozdział.</p>
      </div>
      <div class="reader-layout">
        <aside class="reader-toc" aria-label="Spis treści statutu" id="reader-toc"></aside>
        <div class="statute-reader" id="chapter-teaser"></div>
      </div>
    </section>

    <section class="missing-section" id="braki">
      <div class="section-heading"><p>Do opracowania</p><h2>Dokumenty wskazane przez statut, których brakuje w katalogu</h2><a class="section-link" href="./braki/">Otwórz osobną stronę z brakami</a></div>
      <div class="missing-list" id="missing-list"></div>
    </section>

    <section class="sources-section" id="zrodla">
      <div class="section-heading"><p>Źródła zewnętrzne</p><h2>Akty prawne i odwołania</h2></div>
      <div class="source-list">
        ${data.externalSources.map((source) => `<a href="${esc(source.url)}" rel="noreferrer" target="_blank">${esc(source.title)}</a>`).join("")}
      </div>
    </section>

    <script id="search-data" type="application/json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>
    <script src="./app.js"></script>
  </main>`,
});

const appJs = `const data = JSON.parse(document.getElementById("search-data").textContent);
const state = { query: "", category: "Wszystko" };
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const norm = (value) => String(value).toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
const includesQuery = (value, query) => norm(value).includes(norm(query));
const statusLabel = ${statusLabel.toString()};
function filtered() {
  const docs = data.documents.filter((document) => {
    const matchesCategory = state.category === "Wszystko" || state.category === document.category || (state.category === "Programy" && document.category === "Programy");
    const haystack = [document.title, document.category, document.status, document.statuteRefs.join(" "), document.body].join(" ");
    return matchesCategory && (!state.query || includesQuery(haystack, state.query));
  });
  const sections = (state.category === "Wszystko" || state.category === "Statut")
    ? data.statuteSections.filter((section) => !state.query || includesQuery([section.title, section.chapter, section.body].join(" "), state.query))
    : [];
  const chapterTitles = new Set(sections.map((section) => section.chapter));
  const chapters = !state.query ? data.statuteChapters : data.statuteChapters.filter((chapter) => chapterTitles.has(chapter.title));
  const missing = (state.category === "Wszystko" || state.category === "Braki")
    ? data.missingDocuments.filter((document) => !state.query || includesQuery([document.title, document.category, document.ref, document.note].join(" "), state.query))
    : [];
  return { docs, sections, chapters, missing };
}
function render() {
  const result = filtered();
  $("count-docs").textContent = result.docs.length;
  $("count-statut").textContent = result.sections.length;
  $("count-braki").textContent = result.missing.length;
  document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === state.category));
  $("document-list").innerHTML = result.docs.length ? result.docs.map((document) => \`
    <article class="doc-card">
      <a class="card-cover-link" href="./dokumenty/\${esc(document.id)}/" aria-label="Czytaj: \${esc(document.title)}"></a>
      <div class="doc-card-head"><span class="pill">\${esc(document.category)}</span><span class="status status-\${esc(document.status.replaceAll(" ", "-"))}">\${esc(statusLabel(document.status))}</span></div>
      <h3>\${esc(document.title)}</h3>
      <p>\${esc(document.excerpt)}</p>
      \${document.status === "propozycja" ? '<div class="proposal-notice">Propozycja robocza. Pełna treść jest na osobnej stronie dokumentu.</div>' : ""}
      <div class="refs">\${document.statuteRefs.map((ref) => \`<span>\${esc(ref)}</span>\`).join("")}</div>
      <div class="doc-actions"><a class="read-link" href="./dokumenty/\${esc(document.id)}/">Czytaj</a>\${document.hasDownload && document.download ? \`<a href=".\${esc(document.download)}">Pobierz</a>\` : ""}</div>
    </article>\`).join("") : '<p class="empty">Brak dokumentów dla tego filtra.</p>';
  $("reader-toc").innerHTML = \`
    <div class="reader-toc-header"><strong>\${result.chapters.length}</strong><span>\${state.query ? "rozdziałów z trafieniami" : "rozdziałów"}</span></div>
    <a class="reader-download" href="./docs/Statut_Zespolu_Szkol_Zawodowych_nr_20251015.pdf">Pobierz oryginalny PDF</a>
    <nav>\${result.chapters.map((chapter) => \`<a href="./statut/\${esc(chapter.id)}/">\${esc(chapter.title)}</a>\`).join("")}</nav>\`;
  $("chapter-teaser").innerHTML = result.chapters.length ? \`
    <article class="reader-article chapter-teaser"><span>Podgląd</span><h3>\${esc(result.chapters[0].title)}</h3><p>Otwórz rozdział, żeby czytać statut w osobnym, krótszym widoku bez ładowania całego tekstu naraz.</p><a class="section-link" href="./statut/\${esc(result.chapters[0].id)}/">Otwórz rozdział</a></article>\`
    : '<p class="empty">Brak rozdziałów statutu dla tego filtra.</p>';
  $("missing-list").innerHTML = result.missing.length ? result.missing.map((document) => \`
    <article class="missing-item"><div><span class="pill">\${esc(document.category)}</span><h3>\${esc(document.title)}</h3><p>\${esc(document.note)}</p></div><strong>\${esc(document.ref)}</strong></article>\`).join("") : '<p class="empty">Brak pozycji dla tego filtra.</p>';
}
$("search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
$("clear").addEventListener("click", () => { state.query = ""; $("search").value = ""; render(); });
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.filter; render(); }));
render();`;

function documentPage(document) {
  const prefix = relativePrefix(2);
  return shell({
    title: `${document.title} | Procedury Szkoły Mistrzów`,
    description: document.excerpt,
    depth: 2,
    body: `<main>
      ${topbar(prefix)}
      <section class="document-page">
        <div class="document-shell">
          <aside class="document-meta" aria-label="Informacje o dokumencie">
            <span class="pill">${esc(document.category)}</span>
            <span class="status status-${esc(document.status.replaceAll(" ", "-"))}">${esc(statusLabel(document.status))}</span>
            <div><p>Podstawa w statucie</p><strong>${esc(document.statuteRefs.join(", "))}</strong></div>
            ${document.hasDownload && document.download ? `<a class="download-link" href="${fileHref(document.download, prefix)}">Pobierz plik źródłowy</a>` : ""}
          </aside>
          <article class="document-full">
            <h1>${esc(document.title)}</h1>
            ${
              document.status === "propozycja"
                ? `<div class="proposal-notice">To jest propozycja robocza przygotowana na podstawie kwerendy. Nie jest jeszcze aktem obowiązującym szkoły i wymaga konfrontacji z dokumentami ZSZ nr 5 oraz weryfikacji prawnej.</div>`
                : ""
            }
            <div class="document-reader document-reader-full">${structuredHtml(document.body)}</div>
          </article>
        </div>
      </section>
    </main>`,
  });
}

function statuteIndexPage() {
  const prefix = relativePrefix(1);
  const firstChapter = data.statuteChapters[0];
  return shell({
    title: "Rozdziały statutu | Procedury Szkoły Mistrzów",
    description: "Statut ZSZ nr 5 podzielony na osobne rozdziały.",
    depth: 1,
    body: `<main>
      ${topbar(prefix, "statut")}
      <section class="statute-section">
        <div class="section-heading"><p>Statut tekstowy</p><h1>Rozdziały statutu</h1><p class="section-lead">Wybierz rozdział z menu. Każdy rozdział otwiera się jako osobna strona.</p></div>
        <div class="reader-layout">
          <aside class="reader-toc" aria-label="Spis treści statutu">
            <div class="reader-toc-header"><strong>${data.statuteChapters.length}</strong><span>rozdziałów</span></div>
            <nav>${data.statuteChapters.map((chapter) => `<a href="${chapterHref(chapter, prefix)}">${esc(chapter.title)}</a>`).join("")}</nav>
          </aside>
          <article class="reader-article chapter-teaser"><span>Start</span><h2>${esc(firstChapter?.title || "Statut")}</h2><p>Otwórz pierwszy rozdział albo wybierz dowolny rozdział z menu po lewej.</p>${firstChapter ? `<a class="section-link" href="${chapterHref(firstChapter, prefix)}">Otwórz pierwszy rozdział</a>` : ""}</article>
        </div>
      </section>
    </main>`,
  });
}

function statuteChapterPage(chapter) {
  const prefix = relativePrefix(2);
  return shell({
    title: `${chapter.title} | Statut ZSZ nr 5`,
    description: `${chapter.title} w Statucie Zespołu Szkół Zawodowych nr 5 we Wrocławiu.`,
    depth: 2,
    body: `<main>
      ${topbar(prefix, "statut")}
      <section class="statute-section">
        <div class="section-heading"><p>Statut tekstowy</p><h1>${esc(chapter.title)}</h1><p class="section-lead">Wyświetlany jest tylko jeden rozdział. Pozostałe rozdziały są dostępne z menu po lewej stronie.</p></div>
        <div class="reader-layout">
          <aside class="reader-toc" aria-label="Spis treści statutu">
            <div class="reader-toc-header"><strong>${data.statuteChapters.length}</strong><span>rozdziałów</span></div>
            <a class="reader-download" href="${fileHref(data.siteStats.statuteDownload, prefix)}">Pobierz oryginalny PDF</a>
            <nav>${data.statuteChapters.map((item) => `<a class="${item.id === chapter.id ? "active" : ""}" href="${chapterHref(item, prefix)}">${esc(item.title)}</a>`).join("")}</nav>
          </aside>
          <div class="statute-reader">
            ${chapter.sections
              .map(
                (section) => `<article class="reader-article" id="${esc(section.id)}"><span>${esc(section.chapter)}</span><h2>${esc(section.title)}</h2><div class="reader-text">${structuredHtml(section.body)}</div></article>`,
              )
              .join("")}
          </div>
        </div>
      </section>
    </main>`,
  });
}

function missingPage() {
  const prefix = relativePrefix(1);
  const groups = groupedMissing();
  return shell({
    title: "Braki w dokumentacji statutowej",
    description: "Lista brakujących procedur, regulaminów i dokumentów wynikających ze statutu ZSZ nr 5.",
    depth: 1,
    body: `<main>
      ${topbar(prefix, "braki")}
      <section class="share-hero">
        <p class="eyebrow">Lista do przekazania</p>
        <h1>Braki w dokumentacji statutowej</h1>
        <p class="lead">Zestawienie dokumentów, procedur, instrukcji i rejestrów, które wynikają ze statutu albo są potrzebne do jego praktycznego stosowania, ale nie są jeszcze włączone do katalogu dokumentów.</p>
        <div class="share-summary" aria-label="Podsumowanie listy braków">
          <div><strong>${data.missingDocuments.length}</strong><span>dokumentów do opracowania</span></div>
          <div><strong>${Object.keys(groups).length}</strong><span>kategorii</span></div>
          <div><strong>${data.documents.length}</strong><span>dokumentów już zebranych</span></div>
        </div>
      </section>
      <section class="share-note"><h2>Jak czytać tę listę</h2><p>Każda pozycja zawiera nazwę dokumentu, typ, podstawę w statucie oraz krótkie uzasadnienie. Lista jest robocza i służy do zaplanowania przygotowania brakujących aktów wewnętrznych szkoły. Jeżeli dla danego obszaru powstała już propozycja robocza, prowadzi do niej osobny odnośnik poniżej.</p><p>Stan indeksu: ${esc(generatedDate)}</p></section>
      ${
        proposalDocuments.length
          ? `<section class="proposal-index" aria-label="Propozycje dokumentów"><div class="section-heading"><p>Propozycje robocze</p><h2>Dokumenty, dla których przygotowano propozycję</h2></div><div class="proposal-grid">${proposalDocuments
              .map(
                (document) => `<a class="proposal-card" href="${docHref(document, prefix)}"><span>${esc(document.category)}</span><h3>${esc(document.title)}</h3><p>Jest propozycja robocza do sprawdzenia i dalszej pracy.</p></a>`,
              )
              .join("")}</div></section>`
          : ""
      }
      <section class="share-missing-list" aria-label="Brakujące dokumenty">
        ${Object.entries(groups)
          .map(
            ([category, items]) => `<article class="share-group"><div class="share-group-header"><h2>${esc(category)}</h2><span>${items.length}</span></div><div class="share-items">${items
              .map(
                (document, index) => `<section class="share-item"><span>${index + 1}</span><div><h3>${esc(document.title)}</h3><p>${esc(document.note)}</p></div><strong>${esc(document.ref)}</strong></section>`,
              )
              .join("")}</div></article>`,
          )
          .join("")}
      </section>
    </main>`,
  });
}

fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);
fs.writeFileSync(path.join(outputDir, "styles.css"), fs.readFileSync(path.join(siteRoot, "app", "globals.css"), "utf8").replace('@import "tailwindcss";', ""));
fs.writeFileSync(path.join(outputDir, "app.js"), appJs);

ensureDir(path.join(outputDir, "braki"));
fs.writeFileSync(path.join(outputDir, "braki", "index.html"), missingPage());

ensureDir(path.join(outputDir, "dokumenty"));
for (const document of data.documents) {
  ensureDir(path.join(outputDir, "dokumenty", document.id));
  fs.writeFileSync(path.join(outputDir, "dokumenty", document.id, "index.html"), documentPage(document));
}

ensureDir(path.join(outputDir, "statut"));
fs.writeFileSync(path.join(outputDir, "statut", "index.html"), statuteIndexPage());
for (const chapter of data.statuteChapters) {
  ensureDir(path.join(outputDir, "statut", chapter.id));
  fs.writeFileSync(path.join(outputDir, "statut", chapter.id, "index.html"), statuteChapterPage(chapter));
}

console.log(`Built GitHub Pages site in ${path.relative(siteRoot, outputDir)}`);
