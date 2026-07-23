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

fs.rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);
copyDir(path.join(publicDir, "assets"), path.join(outputDir, "assets"));
copyDir(path.join(publicDir, "docs"), path.join(outputDir, "docs"));

const html = `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Procedury Szkoły Mistrzów</title>
    <meta name="description" content="Statut, procedury, regulaminy i dokumenty Zespołu Szkół Zawodowych nr 5 we Wrocławiu.">
    <link rel="icon" href="./assets/logo.png">
    <link rel="stylesheet" href="./styles.css">
  </head>
  <body>
    <header class="site-header">
      <nav class="topbar" aria-label="Główna nawigacja">
        <a class="brand" href="#start"><img src="./assets/logo.png" alt="procedury.szkolamistrzow.info"></a>
        <div class="topbar-links">
          <a href="#dokumenty">Dokumenty</a>
          <a href="#statut">Statut</a>
          <a href="#braki">Braki</a>
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
          <div><strong>${data.siteStats.statuteSectionCount}</strong><span>sekcji statutu</span></div>
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
          ${["Wszystko", "Statut", "Procedury", "Regulaminy", "Programy", "Ocenianie", "Braki"]
            .map((item) => `<button type="button" data-filter="${esc(item)}">${esc(item)}</button>`)
            .join("")}
        </div>
      </div>
    </section>

    <section class="dashboard" aria-label="Podsumowanie wyników">
      <div><span id="count-docs">0</span><p>dokumentów w widoku</p></div>
      <div><span id="count-statut">0</span><p>trafień w statucie</p></div>
      <div><span id="count-braki">0</span><p>braków w kolejce</p></div>
      <div><span>${esc(new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt)))}</span><p>ostatnia aktualizacja indeksu</p></div>
    </section>

    <section class="workspace" id="dokumenty">
      <div class="document-list">
        <div class="section-heading"><p>Dokumenty zebrane</p><h2>Rejestr dokumentów</h2></div>
        <div class="list-stack" id="document-list"></div>
      </div>
      <aside class="preview" id="preview"></aside>
    </section>

    <section class="statute-section" id="statut">
      <div class="section-heading">
        <p>Statut tekstowy</p>
        <h2>Pełny aktualny statut do czytania</h2>
        <p class="section-lead">To jest cały tekst statutu w formie HTML. Wyszukiwarka zawęża widoczne paragrafy, a rozpoznane odwołania do aktów zewnętrznych prowadzą do oficjalnych publikacji.</p>
      </div>
      <div class="reader-layout">
        <aside class="reader-toc" aria-label="Spis treści statutu" id="reader-toc"></aside>
        <div class="statute-reader" id="statute-reader"></div>
      </div>
    </section>

    <section class="missing-section" id="braki">
      <div class="section-heading"><p>Do opracowania</p><h2>Dokumenty wskazane przez statut, których brakuje w katalogu</h2></div>
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
  </body>
</html>`;

const css = fs.readFileSync(path.join(siteRoot, "app", "globals.css"), "utf8").replace('@import "tailwindcss";', "");

const js = `const data = JSON.parse(document.getElementById("search-data").textContent);
const state = { query: "", category: "Wszystko", selected: data.documents[0]?.id };
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const norm = (value) => String(value).toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
const includesQuery = (value, query) => norm(value).includes(norm(query));
const statusLabel = (status) => ({ obowiazujacy: "obowiązujący", gotowy: "gotowy", "do uzupelnienia": "do uzupełnienia", brak: "brak" }[status] || status);
const compact = (value, limit = 900) => value.length <= limit ? value : value.slice(0, limit).trim() + "...";
const sourceUrl = (title) => data.externalSources.find((source) => norm(source.title) === norm(title))?.url || "#zrodla";
const legalReferences = [
  { url: sourceUrl("Prawo oswiatowe"), phrases: ["Prawo oświatowe", "Prawa oświatowego"] },
  { url: sourceUrl("Ustawa o systemie oswiaty"), phrases: ["ustawa o systemie oświaty", "ustawy o systemie oświaty"] },
  { url: sourceUrl("Pomoc psychologiczno-pedagogiczna"), phrases: ["pomoc psychologiczno-pedagogiczna", "pomocy psychologiczno-pedagogicznej"] },
  { url: sourceUrl("Indywidualne nauczanie"), phrases: ["indywidualne nauczanie", "indywidualnego nauczania"] },
  { url: sourceUrl("Dokumentacja przebiegu nauczania"), phrases: ["dokumentacja przebiegu nauczania", "dokumentacji przebiegu nauczania"] },
  { url: sourceUrl("Praktyczna nauka zawodu"), phrases: ["praktyczna nauka zawodu", "praktycznej nauki zawodu"] },
  { url: sourceUrl("BHP w szkolach"), phrases: ["bezpieczeństwa i higieny pracy", "BHP"] },
  { url: sourceUrl("Ochrona maloletnich"), phrases: ["Standardy Ochrony Małoletnich", "ochrony małoletnich"] },
];
const legalMatcher = new RegExp("(" + legalReferences.flatMap((reference) => reference.phrases).sort((a, b) => b.length - a.length).map((phrase) => phrase.replace(/[.*+?^$(){}|[\\]\\\\]/g, "\\\\$&")).join("|") + ")", "gi");

function linkedText(value) {
  return esc(value).split(legalMatcher).map((part) => {
    const reference = legalReferences.find((item) => item.phrases.some((phrase) => norm(phrase) === norm(part)));
    if (!reference) return part;
    return \`<a class="legal-link" href="\${esc(reference.url)}" rel="noreferrer" target="_blank">\${part}</a>\`;
  }).join("");
}

function filtered() {
  const docs = data.documents.filter((document) => {
    const matchesCategory = state.category === "Wszystko" || state.category === document.category || (state.category === "Programy" && document.category === "Programy");
    const haystack = [document.title, document.category, document.status, document.statuteRefs.join(" "), document.body].join(" ");
    return matchesCategory && (!state.query || includesQuery(haystack, state.query));
  });
  const sections = (state.category === "Wszystko" || state.category === "Statut")
    ? data.statuteSections.filter((section) => !state.query || includesQuery([section.title, section.chapter, section.body].join(" "), state.query))
    : [];
  const missing = (state.category === "Wszystko" || state.category === "Braki")
    ? data.missingDocuments.filter((document) => !state.query || includesQuery([document.title, document.category, document.ref, document.note].join(" "), state.query))
    : [];
  return { docs, sections, missing };
}

function render() {
  const result = filtered();
  $("count-docs").textContent = result.docs.length;
  $("count-statut").textContent = result.sections.length;
  $("count-braki").textContent = result.missing.length;
  document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === state.category));

  $("document-list").innerHTML = result.docs.length ? result.docs.map((document) => \`
    <article class="doc-card">
      <div class="doc-card-head"><span class="pill">\${esc(document.category)}</span><span class="status status-\${esc(document.status.replaceAll(" ", "-"))}">\${esc(statusLabel(document.status))}</span></div>
      <h3>\${esc(document.title)}</h3>
      <p>\${esc(document.excerpt)}</p>
      <div class="refs">\${document.statuteRefs.map((ref) => \`<span>\${esc(ref)}</span>\`).join("")}</div>
      <div class="doc-actions"><button type="button" data-read="\${esc(document.id)}">Czytaj</button>\${document.hasDownload && document.download ? \`<a href=".\${esc(document.download)}">Pobierz</a>\` : ""}</div>
    </article>\`).join("") : '<p class="empty">Brak dokumentów dla tego filtra.</p>';

  const selected = data.documents.find((document) => document.id === state.selected) || result.docs[0] || data.documents[0];
  state.selected = selected?.id;
  $("preview").innerHTML = selected ? \`
    <div class="preview-header">
      <span class="pill">\${esc(selected.category)}</span>
      <h2>\${esc(selected.title)}</h2>
      <p>Podstawa w statucie: <strong>\${esc(selected.statuteRefs.join(", "))}</strong></p>
      \${selected.hasDownload && selected.download ? \`<a class="download-link" href=".\${esc(selected.download)}">Pobierz plik źródłowy</a>\` : ""}
    </div>
    <pre>\${esc(compact(selected.body, selected.id === "statut" ? 2200 : 1800))}</pre>\` : "";

  $("reader-toc").innerHTML = \`
    <div class="reader-toc-header"><strong>\${result.sections.length}</strong><span>\${state.query ? "trafień" : "paragrafów"}</span></div>
    <a class="reader-download" href="./docs/Statut_Zespolu_Szkol_Zawodowych_nr_20251015.pdf">Pobierz oryginalny PDF</a>
    <nav>\${result.sections.map((section) => \`<a href="#\${esc(section.id)}"><span>\${esc(section.chapter)}</span>\${esc(section.title)}</a>\`).join("")}</nav>\`;
  $("statute-reader").innerHTML = result.sections.length ? result.sections.map((section) => \`
    <article class="reader-article" id="\${esc(section.id)}"><span>\${esc(section.chapter)}</span><h3>\${esc(section.title)}</h3><p class="reader-text">\${linkedText(section.body)}</p></article>\`).join("") : '<p class="empty">Brak paragrafów statutu dla tego filtra.</p>';

  $("missing-list").innerHTML = result.missing.length ? result.missing.map((document) => \`
    <article class="missing-item"><div><span class="pill">\${esc(document.category)}</span><h3>\${esc(document.title)}</h3><p>\${esc(document.note)}</p></div><strong>\${esc(document.ref)}</strong></article>\`).join("") : '<p class="empty">Brak pozycji dla tego filtra.</p>';
}

$("search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
$("clear").addEventListener("click", () => { state.query = ""; $("search").value = ""; render(); });
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => { state.category = button.dataset.filter; render(); }));
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-read]");
  if (!target) return;
  state.selected = target.dataset.read;
  render();
  $("preview").scrollIntoView({ behavior: "smooth", block: "start" });
});
render();`;

fs.writeFileSync(path.join(outputDir, "index.html"), html);
fs.writeFileSync(path.join(outputDir, "styles.css"), css);
fs.writeFileSync(path.join(outputDir, "app.js"), js);
fs.writeFileSync(path.join(outputDir, ".nojekyll"), "");

console.log(`Built GitHub Pages site in ${path.relative(siteRoot, outputDir)}`);
