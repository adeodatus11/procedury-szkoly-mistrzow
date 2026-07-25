import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteDir = path.join(root, "_site");
const requireReport = process.argv.includes("--require-report");
const errors = [];
const warnings = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function display(file) {
  return path.relative(root, file);
}

function targetForReference(sourceFile, reference) {
  const [withoutHash, hash = ""] = reference.split("#", 2);
  const [pathname] = withoutHash.split("?", 1);
  let target = pathname
    ? pathname.startsWith("/")
      ? path.join(siteDir, decodeURIComponent(pathname.slice(1)))
      : path.resolve(path.dirname(sourceFile), decodeURIComponent(pathname))
    : sourceFile;

  if (pathname.endsWith("/") || (fs.existsSync(target) && fs.statSync(target).isDirectory())) {
    target = path.join(target, "index.html");
  }

  return { target, hash: decodeURIComponent(hash) };
}

function hasAnchor(file, anchor) {
  if (!anchor || !file.endsWith(".html") || !fs.existsSync(file)) return true;
  const html = fs.readFileSync(file, "utf8");
  const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:id|name)=["']${escaped}["']`).test(html);
}

if (!fs.existsSync(siteDir)) {
  throw new Error("Brak katalogu _site. Uruchom najpierw npm run build:static.");
}

const files = walk(siteDir);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const referencePattern = /\b(?:href|src)=["']([^"'<>]+)["']/g;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(referencePattern)) {
    const reference = match[1];
    if (
      /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(reference) ||
      reference === "#"
    ) {
      continue;
    }

    const { target, hash } = targetForReference(file, reference);
    const isOptionalReport =
      !requireReport &&
      target.endsWith(path.join("reports", "Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf"));

    if (!fs.existsSync(target) && !isOptionalReport) {
      errors.push(`${display(file)}: brak celu ${reference}`);
    } else if (!isOptionalReport && !hasAnchor(target, hash)) {
      errors.push(`${display(file)}: brak kotwicy #${hash} w ${display(target)}`);
    }
  }

  if (/dokumenty\/.+\/index\.html$/.test(file) && /\|\s*:?-{2,}:?\s*\|/.test(html)) {
    errors.push(`${display(file)}: wykryto nierenderowaną tabelę Markdown`);
  }
}

const templates = JSON.parse(
  fs.readFileSync(path.join(root, "app", "form-templates-data.json"), "utf8"),
);
for (const template of templates) {
  const download = path.join(siteDir, template.downloadUrl.replace(/^\//, ""));
  if (!fs.existsSync(download)) errors.push(`Brak DOCX wzoru: ${display(download)}`);
  for (const preview of template.previewPages) {
    const image = path.join(siteDir, preview.replace(/^\//, ""));
    if (!fs.existsSync(image)) errors.push(`Brak podglądu PNG: ${display(image)}`);
  }
}

const packageFiles = fs.existsSync(path.join(siteDir, "packages"))
  ? fs.readdirSync(path.join(siteDir, "packages")).filter((file) => file.endsWith(".zip"))
  : [];
if (packageFiles.length !== 7) {
  errors.push(`Oczekiwano 7 paczek ZIP, znaleziono ${packageFiles.length}.`);
}

const searchData = JSON.parse(
  fs.readFileSync(path.join(siteDir, "global-search-data.json"), "utf8"),
);
if (searchData.entries.length < 200) {
  errors.push(`Indeks globalny jest niepełny: ${searchData.entries.length} wpisów.`);
}

const changesHtml = fs.readFileSync(path.join(siteDir, "zmiany", "index.html"), "utf8");
const changeCount = (changesHtml.match(/class="change-entry /g) || []).length;
if (changeCount !== 39) {
  errors.push(`Centrum zmian zawiera ${changeCount} pozycji zamiast 39.`);
}

const report = path.join(siteDir, "reports", "Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf");
if (requireReport && !fs.existsSync(report)) {
  errors.push(`Brak raportu PDF: ${display(report)}`);
} else if (!requireReport && !fs.existsSync(report)) {
  warnings.push("Raport PDF nie jest wymagany w audycie lokalnym; powstaje podczas wdrożenia.");
}

const summary = [
  `HTML: ${htmlFiles.length}`,
  `pliki: ${files.length}`,
  `wzory DOCX: ${templates.length}`,
  `paczki ZIP: ${packageFiles.length}`,
  `wpisy wyszukiwarki: ${searchData.entries.length}`,
  `zmiany statutu: ${changeCount}`,
].join(" | ");

console.log(`Audit site: ${summary}`);
for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Audit completed without errors.");
}
