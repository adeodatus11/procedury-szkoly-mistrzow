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
  if (/^\d+\)/.test(trimmed)) return "structured-line line-punkt";
  if (/^[-•]/.test(trimmed)) return "structured-line line-punkt";
  if (/^[a-z]\)/i.test(trimmed)) return "structured-line line-litera";
  if (/^https?:\/\//.test(trimmed)) return "structured-line line-source";
  return "structured-line";
}

function splitMarkdownRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line.trim());
}

function parseMarkdownTable(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !lines[0].includes("|") || !isTableSeparator(lines[1])) return null;

  const headers = splitMarkdownRow(lines[0]);
  const rows = lines.slice(2).filter((line) => line.includes("|")).map(splitMarkdownRow);

  if (!headers.length || !rows.length) return null;

  return { headers, rows };
}

function renderMarkdownTable(block: string, index: number) {
  const table = parseMarkdownTable(block);
  if (!table) return null;

  return (
    <div className="table-scroll" key={`table-${index}`}>
      <table className="document-table">
        <thead>
          <tr>
            {table.headers.map((header, cellIndex) => (
              <th key={`${header}-${cellIndex}`} scope="col">
                {renderLinkedText(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`}>
              {table.headers.map((_, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{renderLinkedText(row[cellIndex] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shouldSplitStructuredBlock(lines: string[]) {
  if (lines.length < 2) return false;
  return lines.some((line) => lineClassName(line) !== "structured-line");
}

function renderTextBlock(block: string, index: number) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (shouldSplitStructuredBlock(lines)) {
    return lines.map((line, lineIndex) => (
      <p className={lineClassName(line)} key={`${line.slice(0, 28)}-${index}-${lineIndex}`}>
        {renderLinkedText(line)}
      </p>
    ));
  }

  return (
    <p className={lineClassName(block)} key={`${block.slice(0, 28)}-${index}`}>
      {renderLinkedText(block)}
    </p>
  );
}

export function renderStructuredText(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block, index) => {
      const table = renderMarkdownTable(block, index);
      if (table) return table;

      return renderTextBlock(block, index);
    });
}
