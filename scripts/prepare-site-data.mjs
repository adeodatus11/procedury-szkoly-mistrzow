import fs from "node:fs";
import path from "node:path";
import { strToU8, zipSync } from "fflate";

const root = process.cwd();
const publicDir = path.join(root, "public");
const templates = JSON.parse(
  fs.readFileSync(path.join(root, "app", "form-templates-data.json"), "utf8"),
);
const content = JSON.parse(
  fs.readFileSync(path.join(publicDir, "search-data.json"), "utf8"),
);
const proposals = JSON.parse(
  fs.readFileSync(path.join(root, "app", "statute-proposals-data.json"), "utf8"),
);

const packageDir = path.join(publicDir, "packages");
const groupDefinitions = Array.from(
  templates.reduce((groups, template) => {
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
  }, new Map()).values(),
);

export const packageDefinitions = [
  ...groupDefinitions.map((group) => ({
    ...group,
    filename: `wzory-${group.id}.zip`,
    description: `Komplet wzorów DOCX do obszaru: ${group.title}.`,
  })),
  {
    id: "wszystkie",
    title: "Wszystkie wzory",
    sourceDocumentId: "",
    sourceDocumentTitle: "Pełny zestaw formularzy roboczych ZSZ nr 5",
    templates,
    filename: "wzory-wszystkie.zip",
    description: "Pełny komplet wszystkich wzorów DOCX dostępnych w serwisie.",
  },
];

function cleanExcerpt(value, limit = 240) {
  const compact = String(value || "").replace(/\s+/g, " ").trim();
  return compact.length <= limit ? compact : `${compact.slice(0, limit - 1).trimEnd()}…`;
}

function proposalTitle(section, proposal) {
  if (proposal.title) return proposal.title;
  return (proposal.replacements || []).reduce(
    (title, [from, to]) => title.replace(from, to),
    section.title,
  );
}

function buildSearchIndex() {
  const chapterByTitle = new Map(
    content.statuteChapters.map((chapter) => [chapter.title, chapter]),
  );
  const entries = [];

  for (const document of content.documents) {
    entries.push({
      id: `document-${document.id}`,
      type: "Dokument",
      category: document.category,
      title: document.title,
      excerpt: cleanExcerpt(document.excerpt || document.body),
      href: `/dokumenty/${document.id}/`,
      keywords: [document.category, document.status, ...document.statuteRefs].join(" "),
    });
  }

  for (const section of content.statuteSections) {
    const chapter = chapterByTitle.get(section.chapter);
    if (!chapter) continue;
    entries.push({
      id: `statute-${section.id}`,
      type: "Statut",
      category: section.chapter,
      title: section.title,
      excerpt: cleanExcerpt(section.body),
      href: `/statut/${chapter.id}/#${section.id}`,
      keywords: section.chapter,
    });
  }

  for (const template of templates) {
    entries.push({
      id: `form-${template.id}`,
      type: "Wzór pisma",
      category: template.groupTitle,
      title: template.title,
      excerpt: cleanExcerpt(template.summary),
      href: `/wzory/${template.id}/`,
      keywords: `${template.code} ${template.sourceDocumentTitle}`,
    });
  }

  for (const missing of content.missingDocuments) {
    entries.push({
      id: `missing-${missing.id}`,
      type: "Brak",
      category: missing.category,
      title: missing.title,
      excerpt: cleanExcerpt(missing.note),
      href: `/braki/#${missing.id}`,
      keywords: missing.ref,
    });
  }

  for (const chapter of content.statuteChapters) {
    for (const section of chapter.sections) {
      const proposal = proposals.proposals[section.id];
      if (!proposal) continue;
      entries.push({
        id: `change-${section.id}`,
        type: "Proponowana zmiana",
        category: proposal.label,
        title: `${section.title} → ${proposalTitle(section, proposal)}`,
        excerpt: cleanExcerpt(proposal.rationale),
        href: `/zmiany/#change-${section.id}`,
        keywords: `${chapter.title} ${proposal.kind} ${proposal.label}`,
      });
    }
  }

  for (const item of packageDefinitions) {
    entries.push({
      id: `package-${item.id}`,
      type: "Pakiet ZIP",
      category: "Pliki do pobrania",
      title: item.title,
      excerpt: item.description,
      href: `/pakiety/#package-${item.id}`,
      keywords: item.templates.map((template) => template.title).join(" "),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
}

async function createPackage(definition) {
  const target = path.join(packageDir, definition.filename);
  const manifest = [
    "WZORY DOKUMENTOW ZSZ NR 5 - DO WERYFIKACJI",
    "",
    definition.title,
    definition.description,
    "",
    "Pliki nie sa obowiazujacymi wzorami szkoly. Wymagaja sprawdzenia i zatwierdzenia.",
    "",
    ...definition.templates.map((template, index) => `${index + 1}. ${template.title} (${template.code})`),
    "",
  ].join("\n");

  const files = {
    "CZYTAJ_TO.txt": strToU8(manifest),
  };
  for (const template of definition.templates) {
    const source = path.join(publicDir, "docs", "wzory", template.docxRelativePath);
    if (!fs.existsSync(source)) {
      throw new Error(`Brak pliku wzoru: ${path.relative(root, source)}`);
    }
    files[path.basename(source)] = new Uint8Array(fs.readFileSync(source));
  }

  fs.writeFileSync(target, zipSync(files, { level: 9 }));
}

fs.rmSync(packageDir, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });

for (const definition of packageDefinitions) {
  await createPackage(definition);
}

fs.writeFileSync(
  path.join(publicDir, "global-search-data.json"),
  `${JSON.stringify(buildSearchIndex(), null, 2)}\n`,
);

console.log(
  `Prepared ${packageDefinitions.length} ZIP packages and the global search index.`,
);
