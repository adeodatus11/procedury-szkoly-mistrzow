import { externalSources } from "./content";

export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function includesQuery(value: string, query: string) {
  return normalize(value).includes(normalize(query));
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    obowiazujacy: "obowiązujący",
    gotowy: "gotowy",
    "do uzupelnienia": "do uzupełnienia",
    propozycja: "propozycja",
    brak: "brak",
  };
  return labels[status] ?? status;
}

export function documentHref(id: string) {
  return `/dokumenty/${id}`;
}

export function statuteChapterHref(id: string) {
  return `/statut/${id}`;
}

function sourceUrl(title: string) {
  return externalSources.find((source) => normalize(source.title) === normalize(title))?.url ?? "#zrodla";
}

const legalReferences = [
  {
    url: sourceUrl("Prawo oswiatowe"),
    phrases: ["Prawo oświatowe", "Prawa oświatowego"],
  },
  {
    url: sourceUrl("Ustawa o systemie oswiaty"),
    phrases: ["ustawa o systemie oświaty", "ustawy o systemie oświaty"],
  },
  {
    url: sourceUrl("Kodeks postepowania administracyjnego"),
    phrases: ["Kodeks postępowania administracyjnego", "Kodeksu postępowania administracyjnego"],
  },
  {
    url: sourceUrl("Pomoc psychologiczno-pedagogiczna"),
    phrases: ["pomoc psychologiczno-pedagogiczna", "pomocy psychologiczno-pedagogicznej"],
  },
  {
    url: sourceUrl("Indywidualne nauczanie"),
    phrases: ["indywidualne nauczanie", "indywidualnego nauczania"],
  },
  {
    url: sourceUrl("Dokumentacja przebiegu nauczania"),
    phrases: ["dokumentacja przebiegu nauczania", "dokumentacji przebiegu nauczania"],
  },
  {
    url: sourceUrl("Kwalifikacyjne kursy zawodowe"),
    phrases: [
      "kwalifikacyjny kurs zawodowy",
      "kwalifikacyjnego kursu zawodowego",
      "kwalifikacyjnych kursów zawodowych",
    ],
  },
  {
    url: sourceUrl("Krajoznawstwo i turystyka"),
    phrases: ["krajoznawstwo i turystyka", "krajoznawstwa i turystyki"],
  },
  {
    url: sourceUrl("Praktyczna nauka zawodu"),
    phrases: ["praktyczna nauka zawodu", "praktycznej nauki zawodu"],
  },
  {
    url: sourceUrl("BHP w szkolach"),
    phrases: ["bezpieczeństwa i higieny pracy", "BHP"],
  },
  {
    url: sourceUrl("Ochrona maloletnich"),
    phrases: ["Standardy Ochrony Małoletnich", "ochrony małoletnich"],
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const legalReferenceMatcher = new RegExp(
  `(${legalReferences
    .flatMap((reference) => reference.phrases)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|")})`,
  "gi",
);

function renderLinkedText(value: string) {
  return value.split(legalReferenceMatcher).map((part, index) => {
    const reference = legalReferences.find((item) =>
      item.phrases.some((phrase) => normalize(phrase) === normalize(part)),
    );

    if (!reference) return part;

    return (
      <a className="legal-link" href={reference.url} key={`${part}-${index}`} rel="noreferrer" target="_blank">
        {part}
      </a>
    );
  });
}

function lineClassName(line: string) {
  const trimmed = line.trim();
  if (/^Rozdział\s+\d+/i.test(trimmed)) return "structured-line line-chapter";
  if (/^§\s*\d+/.test(trimmed)) return "structured-line line-paragraph";
  if (/^\d+[a-z]?\./i.test(trimmed)) return "structured-line line-ustep";
  if (/^\d+\)/.test(trimmed)) return "structured-line line-punkt";
  if (/^[-•]/.test(trimmed)) return "structured-line line-punkt";
  if (/^[a-z]\)/i.test(trimmed)) return "structured-line line-litera";
  if (/^https?:\/\//.test(trimmed)) return "structured-line line-source";
  return "structured-line";
}

export function renderStructuredText(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => (
      <p className={lineClassName(block)} key={`${block.slice(0, 28)}-${index}`}>
        {renderLinkedText(block)}
      </p>
    ));
}
