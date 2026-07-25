import fs from "node:fs";
import path from "node:path";
import { buildInlineDiff, buildTextDiff } from "../app/statute-diff.mjs";

const siteRoot = process.cwd();
const outputDir = path.join(siteRoot, "_site");
const publicDir = path.join(siteRoot, "public");
const dataPath = path.join(publicDir, "search-data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const formTemplates = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "app", "form-templates-data.json"), "utf8"),
);
const statuteProposalData = JSON.parse(
  fs.readFileSync(path.join(siteRoot, "app", "statute-proposals-data.json"), "utf8"),
);
const globalSearchDataPath = path.join(publicDir, "global-search-data.json");

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

function formTemplateHref(template, prefix) {
  return `${prefix}wzory/${template.id}/`;
}

function templatesForDocument(documentId) {
  return formTemplates.filter((template) => template.sourceDocumentId === documentId);
}

function templateForMissingDocument(documentId) {
  const mapping = {
    "missing-5": "archiwum-rejestr-pieczeci",
    "missing-6": "skreslenie-karta-obiegowa",
  };
  return formTemplates.find((template) => template.id === mapping[documentId]);
}

function applyReplacements(value, replacements = []) {
  return replacements.reduce((result, [from, to]) => result.replace(from, to), value);
}

function statuteProposal(section) {
  const update = statuteProposalData.proposals[section.id];

  if (!update) {
    return {
      title: section.title,
      body: section.body,
      kind: "unchanged",
      label: "bez proponowanej zmiany",
      rationale: "",
      changed: false,
    };
  }

  return {
    title: update.title || applyReplacements(section.title, update.replacements),
    body: update.body ?? applyReplacements(section.body, update.replacements),
    kind: update.kind,
    label: update.label,
    rationale: update.rationale,
    changed: true,
  };
}

const statuteChangeEntries = data.statuteChapters.flatMap((chapter) =>
  chapter.sections.flatMap((section) => {
    const proposal = statuteProposal(section);
    if (!proposal.changed) return [];
    return [{
      id: section.id,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      currentTitle: section.title,
      currentBody: section.body,
      proposedTitle: proposal.title,
      proposedBody: proposal.body,
      kind: proposal.kind,
      label: proposal.label,
      rationale: proposal.rationale,
    }];
  }),
);

function splitBodyAtSources(body) {
  const sourcesHeading = /\n(?=\s*\d+\.\s+Źródła wykorzystane w kwerendzie)/i;
  const match = sourcesHeading.exec(body);

  if (match?.index === undefined) {
    return { beforeSources: body, sources: "" };
  }

  return {
    beforeSources: body.slice(0, match.index).trimEnd(),
    sources: body.slice(match.index).trimStart(),
  };
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

function linkedText(value, linkLegalReferences) {
  if (!linkLegalReferences) return esc(value);

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
  if (
    /^\d+(?:\.\d+)*\.?\s+\S/.test(trimmed) &&
    !/[.:;]$/.test(trimmed) &&
    !/^https?:\/\//i.test(trimmed) &&
    !/https?:\/\//i.test(trimmed) &&
    trimmed.split(/\s+/).length <= 12
  ) {
    return "structured-line line-section";
  }
  if (/^\d+[a-z]?\./i.test(trimmed)) return "structured-line line-ustep";
  if (/^\d+\)/.test(trimmed) || /^[-•]/.test(trimmed)) return "structured-line line-punkt";
  if (/^[a-z]\)/i.test(trimmed)) return "structured-line line-litera";
  if (/^https?:\/\//.test(trimmed)) return "structured-line line-source";
  return "structured-line";
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim());
}

function markdownTableHtml(block, linkLegalReferences) {
  const lines = String(block)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !lines[0].includes("|") || !isTableSeparator(lines[1])) return "";

  const headers = splitMarkdownRow(lines[0]);
  const rows = lines.slice(2).filter((line) => line.includes("|")).map(splitMarkdownRow);

  if (!headers.length || !rows.length) return "";

  return `<div class="table-scroll"><table class="document-table"><thead><tr>${headers
    .map((header) => `<th scope="col">${linkedText(header, linkLegalReferences)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${headers
          .map((_, cellIndex) => `<td>${linkedText(row[cellIndex] || "", linkLegalReferences)}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function shouldSplitStructuredBlock(lines) {
  if (lines.length < 2) return false;
  return lines.some((line) => lineClassName(line) !== "structured-line");
}

function structuredBlockHtml(block, linkLegalReferences) {
  const lines = String(block)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (shouldSplitStructuredBlock(lines)) {
    return lines
      .map((line) =>
        /^-{3,}$/.test(line)
          ? '<hr class="document-rule">'
          : `<p class="${lineClassName(line)}">${linkedText(line, linkLegalReferences)}</p>`,
      )
      .join("");
  }

  return `<p class="${lineClassName(block)}">${linkedText(block, linkLegalReferences)}</p>`;
}

function firstBlockLine(block) {
  return String(block).split("\n", 1)[0].trim();
}

function isLegalBasisHeading(block) {
  return /\bpodstaw(?:a|y) prawn(?:a|e)\b/i.test(normalize(firstBlockLine(block)));
}

function startsDocumentSection(block) {
  const className = lineClassName(firstBlockLine(block));
  return /\bline-(?:chapter|paragraph|section)\b/.test(className);
}

function structuredHtml(value) {
  let linkLegalReferences = false;

  return String(value)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^-{3,}$/.test(block)) {
        linkLegalReferences = false;
        return '<hr class="document-rule">';
      }

      if (isLegalBasisHeading(block)) {
        linkLegalReferences = true;
      } else if (startsDocumentSection(block)) {
        linkLegalReferences = false;
      }

      return markdownTableHtml(block, linkLegalReferences) || structuredBlockHtml(block, linkLegalReferences);
    })
    .join("");
}

function statuteDiffSegmentsHtml(segments) {
  return segments
    .map((segment) =>
      segment.kind === "unchanged"
        ? esc(segment.text)
        : `<span class="statute-diff statute-diff-${esc(segment.kind)}">${esc(segment.text)}</span>`,
    )
    .join("");
}

function statuteDiffBodyHtml(current, proposed) {
  return buildTextDiff(current, proposed)
    .map(
      (line) =>
        `<p class="${lineClassName(line.source)} statute-diff-line">${statuteDiffSegmentsHtml(line.segments)}</p>`,
    )
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
  <body>${body}<script src="${prefix}site.js" defer></script></body>
</html>`;
}

function topbar(prefix, current = "") {
  return `<header class="site-header">
    <nav class="topbar" aria-label="Główna nawigacja">
      <a class="brand" href="${prefix}"><img src="${prefix}assets/logo.png" alt="procedury.szkolamistrzow.info"></a>
      <div class="topbar-main">
        <div class="topbar-links">
          <a href="${prefix}">Strona główna</a>
          <a href="${prefix}#dokumenty">Dokumenty</a>
          <a href="${prefix}statut/"${current === "statut" ? ' aria-current="page"' : ""}>Statut</a>
          <a href="${prefix}zmiany/"${current === "zmiany" ? ' aria-current="page"' : ""}>Zmiany</a>
          <a href="${prefix}wzory/"${current === "wzory" ? ' aria-current="page"' : ""}>Wzory</a>
          <a href="${prefix}pakiety/"${current === "pakiety" ? ' aria-current="page"' : ""}>Paczki ZIP</a>
          <a href="${prefix}braki/"${current === "braki" ? ' aria-current="page"' : ""}>Braki</a>
        </div>
        <div class="global-search" role="search" data-search-root="${prefix}">
          <label class="visually-hidden" for="global-search">Szukaj w całym serwisie</label>
          <input aria-autocomplete="list" aria-controls="global-search-results" aria-expanded="false" id="global-search" placeholder="Szukaj w całym serwisie" type="search">
          <div class="global-search-results" hidden id="global-search-results" role="listbox"></div>
        </div>
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
copyDir(path.join(publicDir, "previews"), path.join(outputDir, "previews"));
copyDir(path.join(publicDir, "packages"), path.join(outputDir, "packages"));
fs.copyFileSync(globalSearchDataPath, path.join(outputDir, "global-search-data.json"));
fs.writeFileSync(path.join(outputDir, ".nojekyll"), "");

const generatedDate = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(
  new Date(data.generatedAt),
);
const proposalDocuments = data.documents.filter((document) => document.status === "propozycja");

const indexHtml = shell({
  title: "Procedury Szkoły Mistrzów",
  description: "Statut, procedury, regulaminy i dokumenty Zespołu Szkół Zawodowych nr 5 we Wrocławiu.",
  body: `<main>
    ${topbar("./")}
    <section class="hero" id="start">
        <div class="hero-copy">
          <p class="eyebrow">System dokumentacji ZSZ nr 5</p>
          <h1>Statut, procedury i regulaminy w jednym miejscu</h1>
          <p class="lead">Prosty katalog dokumentów wynikających ze Statutu Zespołu Szkół Zawodowych nr 5 we Wrocławiu. Strona używa aktualnego statutu z 15 października 2025 r. jako dokumentu nadrzędnego.</p>
          <div class="hero-actions">
            <a class="primary-action" href="./docs/Statut_Zespolu_Szkol_Zawodowych_nr_20251015.pdf">Pobierz statut PDF</a>
            <a class="secondary-action" href="#wyszukiwarka">Przejdź do wyszukiwarki</a>
            <a class="secondary-action" href="./zmiany/">Centrum zmian</a>
            <a class="secondary-action" href="./pakiety/">Pobierz paczki ZIP</a>
          </div>
        </div>
        <aside class="hero-status" aria-label="Stan katalogu">
          <div><strong>${data.siteStats.documentCount}</strong><span>dokumentów</span></div>
          <div><strong>${data.siteStats.statuteChapterCount}</strong><span>rozdziałów statutu</span></div>
          <div><strong>${data.siteStats.missingCount}</strong><span>braków do opracowania</span></div>
        </aside>
    </section>

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
        <p>Porównanie statutu</p>
        <h2>Aktualne i proponowane brzmienie</h2>
        <p class="section-lead">Każdy rozdział otwiera się jako osobna strona z aktualnym tekstem po lewej i propozycją po prawej. Menu rozdziałów pozostaje po lewej stronie.</p>
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

const siteJs = `(() => {
  const normalize = (value) => String(value || "").toLocaleLowerCase("pl").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  const escapeHtml = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const search = document.querySelector(".global-search");

  if (search) {
    const input = search.querySelector("input");
    const resultsBox = search.querySelector(".global-search-results");
    let entries = [];
    fetch((search.dataset.searchRoot || "./") + "global-search-data.json")
      .then((response) => response.json())
      .then((data) => {
        entries = data.entries || [];
        if (input.value.trim()) renderResults();
      })
      .catch(() => { entries = []; });

    const close = () => {
      resultsBox.hidden = true;
      input.setAttribute("aria-expanded", "false");
    };
    const renderResults = () => {
      const needle = normalize(input.value.trim());
      if (needle.length < 2) {
        close();
        return;
      }
      const matches = entries
        .map((entry) => {
          const title = normalize(entry.title);
          const haystack = normalize([entry.title, entry.type, entry.category, entry.excerpt, entry.keywords].join(" "));
          const score = title.startsWith(needle) ? 0 : title.includes(needle) ? 1 : haystack.includes(needle) ? 2 : 3;
          return { entry, score };
        })
        .filter((item) => item.score < 3)
        .sort((a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title, "pl"))
        .slice(0, 8)
        .map((item) => item.entry);
      resultsBox.innerHTML = matches.length
        ? matches.map((entry) => '<a href="' + escapeHtml(entry.href) + '" role="option"><span>' + escapeHtml(entry.type) + '</span><strong>' + escapeHtml(entry.title) + '</strong><small>' + escapeHtml(entry.excerpt) + '</small></a>').join("")
        : "<p>Brak wyników.</p>";
      resultsBox.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };

    input.addEventListener("input", renderResults);
    input.addEventListener("focus", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    document.addEventListener("mousedown", (event) => {
      if (!search.contains(event.target)) close();
    });
  }

  document.querySelectorAll("[data-print-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.body.dataset.printMode = button.dataset.printMode;
      window.print();
    });
  });
  window.addEventListener("afterprint", () => {
    delete document.body.dataset.printMode;
  });
  document.querySelectorAll("[data-print-page]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  const changeButtons = document.querySelectorAll("[data-change-filter]");
  if (changeButtons.length) {
    changeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.changeFilter;
        changeButtons.forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        document.querySelectorAll(".change-entry").forEach((entry) => {
          entry.hidden = filter !== "all" && entry.dataset.changeKind !== filter;
        });
      });
    });
  }
})();`;

function formQuickEntryHtml(template, prefix, { compact = false, index } = {}) {
  const firstPreviewPage = fileHref(template.previewPages[0], prefix);
  const downloadUrl = fileHref(template.downloadUrl, prefix);
  const pageLabel = `${template.pageCount} ${template.pageCount === 1 ? "strona" : "strony"}`;

  return `<div class="form-quick-entry form-quick-entry-${compact ? "compact" : "catalog"}">
    ${
      compact
        ? `<a class="form-inline-thumbnail" href="${firstPreviewPage}" rel="noreferrer" target="_blank">
            <img src="${firstPreviewPage}" alt="Podgląd pierwszej strony: ${esc(template.title)}" decoding="async" loading="lazy">
          </a>`
        : ""
    }
    ${index !== undefined ? `<span class="form-number">${index + 1}</span>` : ""}
    <div class="form-quick-copy">
      <span class="form-code">${esc(template.code)}</span>
      <div class="form-title-with-preview">
        <a class="form-title-link" href="${formTemplateHref(template, prefix)}">${esc(template.title)}</a>
        <aside class="form-hover-preview" aria-hidden="true">
          <div><span>${esc(template.code)}</span><strong>DO WERYFIKACJI</strong></div>
          <img src="${firstPreviewPage}" alt="" decoding="async" loading="lazy">
          <p>Podgląd pierwszej strony</p>
        </aside>
      </div>
      ${compact ? "" : `<p>${esc(template.summary)}</p>`}
    </div>
    <div class="form-quick-actions">
      <span class="form-page-count">${pageLabel}</span>
      <a class="form-quick-action form-preview-action" href="${firstPreviewPage}" rel="noreferrer" target="_blank">Podgląd PNG</a>
      <a class="form-quick-action form-download-action" download href="${downloadUrl}">Pobierz DOCX</a>
    </div>
  </div>`;
}

function relatedFormsHtml(templates, prefix) {
  if (!templates.length) return "";

  return `<section class="related-forms related-forms-inline" aria-label="Wzory pism do dokumentu" id="zalaczniki">
    <div class="section-heading"><p>Załączniki robocze</p><h2>Podgląd i pliki do pobrania</h2></div>
    <div class="related-forms-list">
      ${templates.map((template) => formQuickEntryHtml(template, prefix, { compact: true })).join("")}
    </div>
  </section>`;
}

function documentPage(document) {
  const prefix = relativePrefix(2);
  const relatedTemplates = templatesForDocument(document.id);
  const { beforeSources, sources } = relatedTemplates.length
    ? splitBodyAtSources(document.body)
    : { beforeSources: document.body, sources: "" };
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
            ${relatedTemplates.length ? '<a class="related-forms-jump" href="#zalaczniki">Przejdź do wzorów</a>' : ""}
            ${document.hasDownload && document.download ? `<a class="download-link" href="${fileHref(document.download, prefix)}">Pobierz plik źródłowy</a>` : ""}
          </aside>
          <article class="document-full">
            <h1>${esc(document.title)}</h1>
            ${
              document.status === "propozycja"
                ? `<div class="proposal-notice">To jest propozycja robocza przygotowana na podstawie kwerendy. Nie jest jeszcze aktem obowiązującym szkoły i wymaga konfrontacji z dokumentami ZSZ nr 5 oraz weryfikacji prawnej.</div>`
                : ""
            }
            <div class="document-reader document-reader-full">
              ${structuredHtml(beforeSources)}
              ${relatedFormsHtml(relatedTemplates, prefix)}
              ${sources ? `<div class="document-reader-continuation">${structuredHtml(sources)}</div>` : ""}
            </div>
          </article>
        </div>
      </section>
    </main>`,
  });
}

function groupedFormTemplates() {
  return Array.from(
    formTemplates
      .reduce((groups, template) => {
        if (!groups.has(template.groupId)) {
          groups.set(template.groupId, {
            id: template.groupId,
            title: template.groupTitle,
            sourceDocumentId: template.sourceDocumentId,
            sourceDocumentTitle: template.sourceDocumentTitle,
            templates: [],
          });
        }
        groups.get(template.groupId).templates.push(template);
        return groups;
      }, new Map())
      .values(),
  );
}

function documentPackages() {
  const groups = groupedFormTemplates();
  return [
    ...groups.map((group) => ({
      id: group.id,
      title: group.title,
      description: `Komplet wzorów DOCX do obszaru: ${group.title}.`,
      sourceDocumentId: group.sourceDocumentId,
      sourceDocumentTitle: group.sourceDocumentTitle,
      filename: `wzory-${group.id}.zip`,
      templateCount: group.templates.length,
    })),
    {
      id: "wszystkie",
      title: "Wszystkie wzory",
      description: "Pełny komplet wszystkich wzorów DOCX dostępnych w serwisie.",
      sourceDocumentId: "",
      sourceDocumentTitle: "Pełny zestaw formularzy roboczych ZSZ nr 5",
      filename: "wzory-wszystkie.zip",
      templateCount: formTemplates.length,
    },
  ];
}

function formsIndexPage() {
  const prefix = relativePrefix(1);
  const groups = groupedFormTemplates();
  const previewPageCount = formTemplates.reduce((total, template) => total + template.pageCount, 0);

  return shell({
    title: "Wzory pism i formularzy | Procedury Szkoły Mistrzów",
    description: "Robocze wzory pism i formularzy ZSZ nr 5 z podglądami PNG i plikami Word.",
    depth: 1,
    body: `<main>
      ${topbar(prefix, "wzory")}
      <section class="forms-hero">
        <p class="eyebrow">Materiały robocze ZSZ nr 5</p>
        <h1>Wzory pism i formularzy</h1>
        <p class="lead">Zestaw propozycji przygotowanych do procedur i instrukcji. Każdy wzór ma podgląd wszystkich stron, bezpośredni plik Word oraz wykaz źródeł wykorzystanych w kwerendzie.</p>
        <div class="verification-banner"><strong>DO WERYFIKACJI</strong><span>Wzory nie są obowiązującymi dokumentami szkoły. Przed użyciem wymagają zatwierdzenia i dostosowania do konkretnej sprawy.</span></div>
        <div class="forms-summary" aria-label="Podsumowanie wzorów">
          <div><strong>${formTemplates.length}</strong><span>wzorów DOCX</span></div>
          <div><strong>${groups.length}</strong><span>pakietów tematycznych</span></div>
          <div><strong>${previewPageCount}</strong><span>stron podglądu</span></div>
        </div>
      </section>
      <section class="forms-index" aria-label="Katalog wzorów">
        ${groups
          .map(
            (group) => `<article class="forms-group" id="${esc(group.id)}">
              <header class="forms-group-header">
                <div><p>${esc(group.title)}</p><h2>${esc(group.sourceDocumentTitle)}</h2></div>
                <a href="${prefix}dokumenty/${esc(group.sourceDocumentId)}/">Otwórz dokument źródłowy</a>
              </header>
              <div class="forms-list">
                ${group.templates
                  .map((template, index) => formQuickEntryHtml(template, prefix, { index }))
                  .join("")}
              </div>
            </article>`,
          )
          .join("")}
      </section>
    </main>`,
  });
}

function formTemplatePage(template) {
  const prefix = relativePrefix(2);
  const siblings = templatesForDocument(template.sourceDocumentId);

  return shell({
    title: `${template.title} | Wzory dokumentów ZSZ nr 5`,
    description: template.summary,
    depth: 2,
    body: `<main>
      ${topbar(prefix, "wzory")}
      <section class="form-detail">
        <aside class="form-detail-meta" aria-label="Informacje o wzorze">
          <span class="status status-propozycja">propozycja</span>
          <strong>${esc(template.code)}</strong>
          <div><p>Pakiet</p><span>${esc(template.groupTitle)}</span></div>
          <div><p>Liczba stron</p><span>${template.pageCount}</span></div>
          <a class="primary-action" href="${fileHref(template.downloadUrl, prefix)}" download>Pobierz plik Word</a>
          <a class="secondary-action" href="${prefix}dokumenty/${esc(template.sourceDocumentId)}/">Czytaj procedurę lub instrukcję</a>
        </aside>
        <article class="form-detail-main">
          <p class="eyebrow">${esc(template.sourceDocumentTitle)}</p>
          <h1>${esc(template.title)}</h1>
          <p class="lead">${esc(template.summary)}</p>
          <div class="verification-banner verification-banner-strong"><strong>DO WERYFIKACJI</strong><span>To propozycja tego, jak dokument może wyglądać. Nie jest jeszcze obowiązującym wzorem ZSZ nr 5 i wymaga sprawdzenia merytorycznego, prawnego oraz zatwierdzenia przez dyrektora.</span></div>
          <section class="preview-section" aria-label="Podgląd dokumentu">
            <div class="section-heading"><p>Szybki podgląd</p><h2>Wszystkie strony dokumentu</h2></div>
            <div class="preview-pages">
              ${template.previewPages
                .map(
                  (page, index) => `<figure class="preview-page">
                    <img src="${fileHref(page, prefix)}" alt="${esc(template.title)} - podgląd strony ${index + 1} z ${template.pageCount}" loading="${index === 0 ? "eager" : "lazy"}">
                    <figcaption>Strona ${index + 1} z ${template.pageCount}</figcaption>
                  </figure>`,
                )
                .join("")}
            </div>
          </section>
          <section class="research-section">
            <div class="section-heading"><p>Kwerenda</p><h2>Podstawa opracowania</h2></div>
            <p>Zakres pól wzoru opracowano na podstawie niżej wskazanych przepisów, materiałów urzędowych i przykładów szkolnych. Źródła służą do weryfikacji projektu, nie zastępują analizy konkretnej sprawy.</p>
            <div class="research-links">
              ${template.sources
                .map((source) => `<a href="${esc(source.url)}" rel="noreferrer" target="_blank">${esc(source.label)}</a>`)
                .join("")}
            </div>
          </section>
          <nav class="sibling-forms" aria-label="Pozostałe wzory w pakiecie">
            <h2>Pozostałe wzory w tym pakiecie</h2>
            ${siblings
              .map(
                (item) => `<a class="${item.id === template.id ? "active" : ""}" href="${formTemplateHref(item, prefix)}"><span>${esc(item.code)}</span>${esc(item.title)}</a>`,
              )
              .join("")}
          </nav>
        </article>
      </section>
    </main>`,
  });
}

function statuteIndexPage() {
  const prefix = relativePrefix(1);
  const firstChapter = data.statuteChapters[0];
  return shell({
    title: "Porównanie statutu | Procedury Szkoły Mistrzów",
    description: "Aktualny Statut ZSZ nr 5 i propozycja umiarkowanego uproszczenia, rozdział po rozdziale.",
    depth: 1,
    body: `<main>
      ${topbar(prefix, "statut")}
      <section class="statute-section">
        <div class="section-heading"><p>Porównanie statutu</p><h1>Aktualne brzmienie i propozycja</h1><p class="section-lead">Wybierz rozdział, aby porównać obowiązujący tekst z umiarkowanie uproszczoną propozycją. Każdy rozdział otwiera się jako osobna strona.</p></div>
        <div class="reader-layout">
          <aside class="reader-toc" aria-label="Spis treści statutu">
            <div class="reader-toc-header"><strong>${data.statuteChapters.length}</strong><span>rozdziałów</span></div>
            <nav>${data.statuteChapters.map((chapter) => `<a href="${chapterHref(chapter, prefix)}">${esc(chapter.title)}</a>`).join("")}</nav>
          </aside>
          <article class="reader-article chapter-teaser"><span>Start</span><h2>${esc(firstChapter?.title || "Statut")}</h2><p>Po lewej stronie zobaczysz tekst z 15 października 2025 r., a po prawej proponowane brzmienie i uzasadnienie zmiany.</p>${firstChapter ? `<a class="section-link" href="${chapterHref(firstChapter, prefix)}">Otwórz pierwszy rozdział</a>` : ""}</article>
        </div>
      </section>
    </main>`,
  });
}

function printToolbarHtml(prefix) {
  return `<div class="print-toolbar" aria-label="Drukowanie i eksport">
    <strong>Druk i eksport</strong>
    <button data-print-mode="comparison" type="button">Drukuj porównanie</button>
    <button data-print-mode="current" type="button">Tylko tekst aktualny</button>
    <button data-print-mode="proposed" type="button">Tylko propozycję</button>
    <a href="${prefix}reports/Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf">Raport PDF</a>
  </div>`;
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
        <div class="section-heading"><p>Porównanie robocze</p><h1>${esc(chapter.title)}</h1><p class="section-lead">Po lewej stronie znajduje się tekst jednolity z 15 października 2025 r., a po prawej propozycja uproszczenia i aktualizacji zachowująca rozwiązania właściwe dla ZSZ nr 5.</p></div>
        <div class="statute-proposal-notice">
          <strong>${esc(statuteProposalData.notice)}</strong>
          <p>${esc(statuteProposalData.method)}</p>
          <div class="statute-comparison-summary" aria-label="Zakres porównania">
            <span>Stan kwerendy: ${esc(statuteProposalData.asOf)}</span>
            <span>${Object.keys(statuteProposalData.proposals).length} paragrafów z propozycją zmiany</span>
            <span>Pozostałe paragrafy zachowane bez zmian</span>
          </div>
          <div class="statute-diff-legend" aria-label="Legenda oznaczeń zmian">
            <strong>Oznaczenia zmian:</strong>
            <span><span class="statute-diff statute-diff-removed">tekst usunięty</span></span>
            <span><span class="statute-diff statute-diff-changed">tekst zmieniony</span></span>
            <span><span class="statute-diff statute-diff-added">tekst nowy</span></span>
          </div>
        </div>
        <section class="statute-legal-basis" aria-labelledby="statute-legal-basis-title">
          <div><p>Podstawa prawna i źródła metodyczne</p><h2 id="statute-legal-basis-title">Źródła wykorzystane do porównania</h2></div>
          <div class="statute-source-links">${statuteProposalData.sources
            .map((source) => `<a href="${esc(source.url)}" rel="noreferrer" target="_blank">${esc(source.label)}</a>`)
            .join("")}</div>
        </section>
        ${printToolbarHtml(prefix)}
        <div class="reader-layout">
          <aside class="reader-toc" aria-label="Spis treści statutu">
            <div class="reader-toc-header"><strong>${data.statuteChapters.length}</strong><span>rozdziałów</span></div>
            <a class="reader-download" href="${fileHref(data.siteStats.statuteDownload, prefix)}">Pobierz oryginalny PDF</a>
            <nav>${data.statuteChapters.map((item) => `<a class="${item.id === chapter.id ? "active" : ""}" href="${chapterHref(item, prefix)}">${esc(item.title)}</a>`).join("")}</nav>
          </aside>
          <div class="statute-reader">
            ${chapter.sections
              .map((section) => {
                const proposal = statuteProposal(section);
                return `<article class="statute-comparison-row${proposal.changed ? " has-proposal" : ""}" id="${esc(section.id)}">
                  <section class="statute-version statute-version-current" aria-label="Aktualne brzmienie ${esc(section.title)}">
                    <div class="statute-version-heading"><span>Aktualne brzmienie</span><small>tekst z 15.10.2025 r.</small></div>
                    <h2>${esc(section.title)}</h2>
                    <div class="reader-text">${structuredHtml(section.body)}</div>
                  </section>
                  <section class="statute-version statute-version-proposed proposal-${esc(proposal.kind)}" aria-label="Proponowane brzmienie ${esc(proposal.title)}">
                    <div class="statute-version-heading"><span>Proponowane brzmienie</span><small>${esc(proposal.label)}</small></div>
                    <h2>${proposal.changed ? statuteDiffSegmentsHtml(buildInlineDiff(section.title, proposal.title)) : esc(proposal.title)}</h2>
                    <div class="reader-text">${proposal.changed ? statuteDiffBodyHtml(section.body, proposal.body) : structuredHtml(proposal.body)}</div>
                    ${proposal.rationale ? `<p class="statute-rationale">${esc(proposal.rationale)}</p>` : ""}
                  </section>
                </article>`;
              })
              .join("")}
          </div>
        </div>
      </section>
    </main>`,
  });
}

function changesPage() {
  const prefix = relativePrefix(1);
  const kinds = [
    { id: "legal-update", label: "Aktualizacja prawa" },
    { id: "simplification", label: "Uproszczenie" },
    { id: "consolidation", label: "Scalenie" },
  ];
  return shell({
    title: "Centrum zmian statutu | Procedury Szkoły Mistrzów",
    description: "Rejestr wszystkich proponowanych aktualizacji, uproszczeń i scaleń w Statucie ZSZ nr 5.",
    depth: 1,
    body: `<main>
      ${topbar(prefix, "zmiany")}
      <section class="changes-hero">
        <p class="eyebrow">Centrum zmian statutu</p>
        <h1>Rejestr proponowanych zmian</h1>
        <p class="lead">Jedno zestawienie wszystkich proponowanych aktualizacji, uproszczeń i scaleń. Każda pozycja prowadzi bezpośrednio do właściwego paragrafu w porównaniu rozdziałowym.</p>
        <div class="verification-banner"><strong>PROPOZYCJA ROBOCZA</strong><span>${esc(statuteProposalData.notice)}</span></div>
        <div class="change-summary" aria-label="Podsumowanie zmian">
          <div><strong>${statuteChangeEntries.length}</strong><span>proponowanych zmian</span></div>
          ${kinds.map((kind) => `<div><strong>${statuteChangeEntries.filter((entry) => entry.kind === kind.id).length}</strong><span>${esc(kind.label.toLocaleLowerCase("pl"))}</span></div>`).join("")}
        </div>
        <div class="change-actions">
          <a class="primary-action" href="${prefix}reports/Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf">Pobierz raport PDF</a>
          <a class="secondary-action" href="${prefix}zmiany/druk/">Otwórz wersję do druku</a>
        </div>
      </section>
      <section class="changes-index" aria-label="Rejestr zmian">
        <div class="change-filters" aria-label="Filtry zmian">
          <button class="active" aria-pressed="true" data-change-filter="all" type="button">Wszystkie</button>
          <button aria-pressed="false" data-change-filter="legal-update" type="button">Aktualizacje prawa</button>
          <button aria-pressed="false" data-change-filter="simplification" type="button">Uproszczenia</button>
          <button aria-pressed="false" data-change-filter="consolidation" type="button">Scalenia</button>
        </div>
        <div class="change-register" aria-live="polite">
          ${statuteChangeEntries.map((entry, index) => `<article class="change-entry change-${esc(entry.kind)}" data-change-kind="${esc(entry.kind)}" id="change-${esc(entry.id)}">
            <div class="change-entry-number">${String(index + 1).padStart(2, "0")}</div>
            <div class="change-entry-copy">
              <div class="change-entry-meta"><span>${esc(entry.label)}</span><strong>${esc(entry.chapterTitle)}</strong></div>
              <h2>${esc(entry.currentTitle)}</h2>
              ${entry.proposedTitle !== entry.currentTitle ? `<p class="change-proposed-title">Proponowany tytuł: ${esc(entry.proposedTitle)}</p>` : ""}
              <p>${esc(entry.rationale)}</p>
              <a href="${prefix}statut/${esc(entry.chapterId)}/#${esc(entry.id)}">Otwórz porównanie w rozdziale</a>
            </div>
          </article>`).join("")}
        </div>
      </section>
    </main>`,
  });
}

function printableChangesPage() {
  const prefix = relativePrefix(2);
  return shell({
    title: "Wykaz proponowanych zmian statutu ZSZ nr 5",
    description: "Pełne porównanie aktualnego i proponowanego brzmienia zmienianych paragrafów statutu.",
    depth: 2,
    body: `<main class="print-report">
      ${topbar(prefix, "zmiany")}
      <header class="print-report-header">
        <p>Zespół Szkół Zawodowych nr 5 we Wrocławiu</p>
        <h1>Wykaz proponowanych zmian statutu</h1>
        <span>Stan kwerendy: ${esc(statuteProposalData.asOf)}</span>
        <strong>PROPOZYCJA ROBOCZA DO WERYFIKACJI</strong>
        <button data-print-page type="button">Drukuj raport</button>
      </header>
      <section class="print-report-notice"><p>${esc(statuteProposalData.notice)}</p><p>${esc(statuteProposalData.method)}</p></section>
      ${statuteChangeEntries.map((entry, index) => `<article class="print-change" id="change-${esc(entry.id)}">
        <div class="print-change-heading"><span>Zmiana ${index + 1} z ${statuteChangeEntries.length}</span><strong>${esc(entry.chapterTitle)}</strong><small>${esc(entry.label)}</small></div>
        <div class="print-change-columns">
          <section class="statute-version statute-version-current">
            <div class="statute-version-heading"><span>Aktualne brzmienie</span></div>
            <h2>${esc(entry.currentTitle)}</h2>
            <div class="reader-text">${structuredHtml(entry.currentBody)}</div>
          </section>
          <section class="statute-version statute-version-proposed proposal-${esc(entry.kind)}">
            <div class="statute-version-heading"><span>Proponowane brzmienie</span></div>
            <h2>${statuteDiffSegmentsHtml(buildInlineDiff(entry.currentTitle, entry.proposedTitle))}</h2>
            <div class="reader-text">${statuteDiffBodyHtml(entry.currentBody, entry.proposedBody)}</div>
            <p class="statute-rationale">${esc(entry.rationale)}</p>
          </section>
        </div>
      </article>`).join("")}
    </main>`,
  });
}

function packagesPage() {
  const prefix = relativePrefix(1);
  const packages = documentPackages();
  return shell({
    title: "Paczki dokumentów ZIP | Procedury Szkoły Mistrzów",
    description: "Tematyczne paczki wzorów dokumentów Word ZSZ nr 5 do pobrania.",
    depth: 1,
    body: `<main>
      ${topbar(prefix, "pakiety")}
      <section class="packages-hero">
        <p class="eyebrow">Pliki do pobrania</p>
        <h1>Paczki wzorów dokumentów</h1>
        <p class="lead">Pobierz cały zestaw tematyczny w jednym pliku ZIP. Każda paczka zawiera edytowalne pliki Word i informację, że wzory wymagają weryfikacji przed zatwierdzeniem.</p>
        <div class="verification-banner"><strong>DO WERYFIKACJI</strong><span>Paczki zawierają propozycje robocze, a nie obowiązujące wzory ZSZ nr 5.</span></div>
        <div class="packages-summary"><div><strong>${packages.length}</strong><span>paczek ZIP</span></div><div><strong>${formTemplates.length}</strong><span>wzorów DOCX</span></div></div>
      </section>
      <section class="packages-list" aria-label="Dostępne paczki">
        ${packages.map((item) => `<article class="package-row${item.id === "wszystkie" ? " package-row-all" : ""}" id="package-${esc(item.id)}">
          <div><span>${item.templateCount} plików DOCX</span><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p>${item.sourceDocumentId ? `<a href="${prefix}dokumenty/${esc(item.sourceDocumentId)}/">${esc(item.sourceDocumentTitle)}</a>` : ""}</div>
          <a class="primary-action" download href="${prefix}packages/${esc(item.filename)}">Pobierz ZIP</a>
        </article>`).join("")}
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
                (document, index) => {
                  const template = templateForMissingDocument(document.id);
                  return `<section class="share-item" id="${esc(document.id)}"><span>${index + 1}</span><div><h3>${esc(document.title)}</h3><p>${esc(document.note)}</p>${template ? `<a class="missing-proposal-link" href="${formTemplateHref(template, prefix)}">Jest propozycja wzoru - otwórz podgląd i plik Word</a>` : ""}</div><strong>${esc(document.ref)}</strong></section>`;
                },
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
fs.writeFileSync(path.join(outputDir, "site.js"), siteJs);

ensureDir(path.join(outputDir, "braki"));
fs.writeFileSync(path.join(outputDir, "braki", "index.html"), missingPage());

ensureDir(path.join(outputDir, "dokumenty"));
for (const document of data.documents) {
  ensureDir(path.join(outputDir, "dokumenty", document.id));
  fs.writeFileSync(path.join(outputDir, "dokumenty", document.id, "index.html"), documentPage(document));
}

ensureDir(path.join(outputDir, "wzory"));
fs.writeFileSync(path.join(outputDir, "wzory", "index.html"), formsIndexPage());
for (const template of formTemplates) {
  ensureDir(path.join(outputDir, "wzory", template.id));
  fs.writeFileSync(path.join(outputDir, "wzory", template.id, "index.html"), formTemplatePage(template));
}

ensureDir(path.join(outputDir, "statut"));
fs.writeFileSync(path.join(outputDir, "statut", "index.html"), statuteIndexPage());
for (const chapter of data.statuteChapters) {
  ensureDir(path.join(outputDir, "statut", chapter.id));
  fs.writeFileSync(path.join(outputDir, "statut", chapter.id, "index.html"), statuteChapterPage(chapter));
}

ensureDir(path.join(outputDir, "zmiany", "druk"));
fs.writeFileSync(path.join(outputDir, "zmiany", "index.html"), changesPage());
fs.writeFileSync(path.join(outputDir, "zmiany", "druk", "index.html"), printableChangesPage());

ensureDir(path.join(outputDir, "pakiety"));
fs.writeFileSync(path.join(outputDir, "pakiety", "index.html"), packagesPage());

console.log(`Built GitHub Pages site in ${path.relative(siteRoot, outputDir)}`);
