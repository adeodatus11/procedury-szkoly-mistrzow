import fs from "node:fs";
import path from "node:path";

const root = path.resolve("..");
const siteRoot = process.cwd();
const publicDocs = path.join(siteRoot, "public", "docs");
const publicData = path.join(siteRoot, "public", "search-data.json");
const outputPath = path.join(siteRoot, "app", "content.ts");
const generatedAt = "2026-07-24T08:08:07.000Z";

const sourceFiles = [
  {
    id: "statut",
    title: "Statut Zespolu Szkol Zawodowych nr 5",
    category: "Statut",
    source: "Statut_Zespolu_Szkol_Zawodowych_nr_20251015.md",
    download: "/docs/Statut_Zespolu_Szkol_Zawodowych_nr_20251015.pdf",
    statuteRefs: ["calosc"],
    status: "obowiazujacy",
  },
  {
    id: "proc-ppp",
    title: "Procedura Udzielania Pomocy Psychologiczno-Pedagogicznej Uczniom",
    category: "Procedury",
    source: "procedury/PROC_01_Pomoc_PPP.md",
    download: "/docs/PROC_01_Pomoc_PPP.docx",
    statuteRefs: ["§ 14-25a"],
    status: "gotowy",
  },
  {
    id: "proc-egzaminy-klasyfikacyjne-poprawkowe",
    title: "Procedura egzaminu klasyfikacyjnego, egzaminu poprawkowego i komisyjnego sprawdzianu wiadomości i umiejętności",
    category: "Procedury",
    source: "procedury/PROC_02_Egzaminy_Klasyfikacyjne_Poprawkowe.md",
    download: "/docs/PROC_02_Egzaminy_Klasyfikacyjne_Poprawkowe.pdf",
    statuteRefs: ["§ 102 ust. 25", "§ 103 ust. 11", "§ 105 ust. 17"],
    status: "gotowy",
  },
  {
    id: "pwp",
    title: "Program Wychowawczo-Profilaktyczny",
    category: "Programy",
    source: "pwp/PWP_Program_Wychowawczo_Profilaktyczny.md",
    download: "/docs/PWP_Program_Wychowawczo_Profilaktyczny.docx",
    statuteRefs: ["§ 4", "§ 6", "§ 72"],
    status: "do uzupelnienia",
  },
  {
    id: "reg-rp",
    title: "Regulamin Rady Pedagogicznej",
    category: "Regulaminy",
    source: "regulaminy/REG_01_Rada_Pedagogiczna.md",
    download: "/docs/REG_01_Rada_Pedagogiczna.docx",
    statuteRefs: ["§ 37", "§ 41-54"],
    status: "gotowy",
  },
  {
    id: "reg-rr",
    title: "Regulamin Rady Rodzicow",
    category: "Regulaminy",
    source: "regulaminy/REG_02_Rada_Rodzicow.md",
    download: "/docs/REG_02_Rada_Rodzicow.docx",
    statuteRefs: ["§ 55"],
    status: "gotowy",
  },
  {
    id: "reg-su",
    title: "Regulamin Samorzadu Uczniowskiego",
    category: "Regulaminy",
    source: "regulaminy/REG_03_Samorzad_Uczniowski.md",
    download: "/docs/REG_03_Samorzad_Uczniowski.docx",
    statuteRefs: ["§ 56"],
    status: "gotowy",
  },
  {
    id: "reg-rada-szkoly",
    title: "Regulamin Rady Szkoly",
    category: "Regulaminy",
    source: "regulaminy/REG_04_Rada_Szkoly.md",
    download: "/docs/REG_04_Rada_Szkoly.docx",
    statuteRefs: ["§ 36-37"],
    status: "gotowy",
  },
  {
    id: "reg-srpou",
    title: "Regulamin Szkolnego Rzecznika Praw i Obowiazkow Ucznia",
    category: "Regulaminy",
    source: "regulaminy/REG_05_SRPOU.md",
    download: "/docs/REG_05_SRPOU.docx",
    statuteRefs: ["§ 122"],
    status: "gotowy",
  },
  {
    id: "reg-biblioteka",
    title: "Regulamin Biblioteki Szkolnej",
    category: "Regulaminy",
    source: "regulaminy/REG_06_Biblioteka.md",
    download: "/docs/REG_06_Biblioteka.docx",
    statuteRefs: ["§ 78"],
    status: "gotowy",
  },
  {
    id: "reg-pnz",
    title: "Regulamin Praktycznej Nauki Zawodu",
    category: "Regulaminy",
    source: "regulaminy/REG_07_PNZ.md",
    download: "/docs/REG_07_PNZ.docx",
    statuteRefs: ["§ 67-71"],
    status: "gotowy",
  },
  {
    id: "ceremonial",
    title: "Ceremonial Szkolny",
    category: "Regulaminy",
    source: "regulaminy/REG_08_Ceremonial.md",
    download: "/docs/REG_08_Ceremonial.docx",
    statuteRefs: ["§ 135a-139"],
    status: "do uzupelnienia",
  },
  {
    id: "reg-dyzury",
    title: "Zasady Organizacyjno-Porzadkowe Pelnienia Dyurow Nauczycielskich",
    category: "Regulaminy",
    source: "regulaminy/REG_09_Dyzury_Nauczycielskie.md",
    download: "/docs/REG_09_Dyzury_Nauczycielskie.docx",
    statuteRefs: ["§ 61 ust. 13", "§ 119 ust. 11-12"],
    status: "do uzupelnienia",
  },
  {
    id: "reg-pracy",
    title: "Regulamin Pracy",
    category: "Regulaminy",
    source: "regulaminy/REG_10_Regulamin_Pracy.md",
    download: "/docs/REG_10_Regulamin_Pracy.docx",
    statuteRefs: ["§ 134-135"],
    status: "gotowy",
  },
  ...[
    ["pzo-humanistyczne", "Przedmiotowe Zasady Oceniania - Przedmioty Humanistyczne", "pzo/PZO_1_humanistyczne.md", "/docs/PZO_1_humanistyczne.docx"],
    ["pzo-mat-przyr", "Przedmiotowe Zasady Oceniania - Przedmioty Matematyczno-Przyrodnicze", "pzo/PZO_2_matematyczno_przyrodnicze.md", "/docs/PZO_2_matematyczno_przyrodnicze.docx"],
    ["pzo-jezyki", "Przedmiotowe Zasady Oceniania - Jezyki Obce Nowozytne", "pzo/PZO_3_jezyki_obce.md", "/docs/PZO_3_jezyki_obce.docx"],
    ["pzo-wf-edb", "Przedmiotowe Zasady Oceniania - WF i EDB", "pzo/PZO_4_WF_EDB.md", "/docs/PZO_4_WF_EDB.docx"],
    ["pzo-zawodowe", "Przedmiotowe Zasady Oceniania - Przedmioty Zawodowe Teoretyczne", "pzo/PZO_5_zawodowe.md", "/docs/PZO_5_zawodowe.docx"],
    ["pzo-pnz", "Przedmiotowe Zasady Oceniania - Praktyczna Nauka Zawodu", "pzo/PZO_6_PNZ.md", "/docs/PZO_6_PNZ.docx"],
    ["pzo-inne", "Przedmiotowe Zasady Oceniania - Inne Przedmioty", "pzo/PZO_7_inne.md", "/docs/PZO_7_inne.docx"],
  ].map(([id, title, source, download]) => ({
    id,
    title,
    category: "Ocenianie",
    source,
    download,
    statuteRefs: ["§ 92-115"],
    status: "gotowy",
  })),
];

const missingDocuments = [
  ["Procedura skreslenia ucznia z listy uczniow", "Procedury", "§ 88-89", "W statucie jest opisana procedura; warto wydzielic ja jako osobny dokument z wzorami pism."],
  ["Procedura organizacji indywidualnego nauczania", "Procedury", "§ 26-35", "Statut opisuje tryb i dokumenty, ale brak osobnej instrukcji operacyjnej."],
  ["Procedura organizowania i funkcjonowania kwalifikacyjnego kursu zawodowego", "Procedury", "§ 66", "Statut wprost wskazuje odrebna procedure."],
  ["Procedura organizowania wycieczek szkolnych", "Procedury", "§ 86 ust. 7, § 119 ust. 14", "Statut wymaga jej stosowania przy wyjsciach i wycieczkach."],
  ["Procedury postepowania w sytuacjach kryzysowych w szkole", "Procedury", "§ 119 ust. 1", "Statut wskazuje je jako podstawowe narzedzie zapewniania bezpieczenstwa."],
  ["Standardy Ochrony Maloletnich", "Programy i standardy", "§ 84 ust. 5, § 85 ust. 3 pkt 1", "Statut nakazuje ich przestrzeganie przez spolecznosc szkolna."],
  ["Instrukcja kancelaryjna", "Instrukcje", "§ 21", "Statut odsyla do niej przy obiegu dokumentow PPP."],
  ["Instrukcja obiegu dokumentow", "Instrukcje", "§ 21, § 77, § 136", "Praktyczne rozwiniecie kancelarii, dokumentacji i archiwizacji."],
  ["Instrukcja archiwizacji dokumentacji szkolnej", "Instrukcje", "§ 39 ust. 3 pkt 7, § 136", "Dyrektor odpowiada za prowadzenie i archiwizacje dokumentacji."],
  ["Instrukcja korzystania z dziennika elektronicznego", "Instrukcje", "§ 1 pkt 9, § 73, § 77", "Dziennik jest kluczowym kanalem dokumentacji i komunikacji."],
  ["Regulamin wejscia do szkoly i kart magnetycznych", "Regulaminy", "§ 61 ust. 14", "Statut wprost odsyla do regulaminu wejscia do szkoly."],
  ["Plan ewakuacji szkoly", "Dokumentacja BHP", "§ 10 ust. 9", "Statut wymaga umieszczenia planu w widocznym miejscu."],
  ["Rejestr pieczeci", "Dokumentacja administracyjna", "§ 137", "Statut wskazuje obowiazek prowadzenia rejestru pieczeci."],
  ["Karta obiegowa ucznia", "Wzory dokumentow", "§ 85 ust. 4", "Statut wymaga rozliczenia ucznia karta obiegowa."],
  ["Plan pracy szkoly", "Dokumenty roczne", "§ 79, § 1123", "Roczny dokument organizujacy dydaktyke, wychowanie, opieke i profilaktyke."],
  ["Plan pracy wychowawczo-profilaktycznej", "Dokumenty roczne", "§ 72", "Roczna warstwa wykonawcza programu wychowawczo-profilaktycznego."],
  ["Plan dyzurow nauczycielskich", "Dokumenty roczne", "§ 61 ust. 13", "Harmonogram wynikajacy z regulaminu dyzurow."],
  ["Szkolny zestaw programow nauczania", "Rejestry", "§ 5 ust. 5-11", "Statut opisuje dopuszczanie, numeracje i ewaluacje programow."],
  ["Roczny zestaw podrecznikow i materialow", "Rejestry", "§ 5 ust. 12-14", "Dyrektor corocznie ustala i oglasza zestaw."],
].map(([title, category, ref, note], index) => ({
  id: `missing-${index + 1}`,
  title,
  category,
  ref,
  note,
  status: "brak",
}));

const externalSources = [
  ["Prawo oswiatowe", "https://eli.gov.pl/eli/DU/2026/820/ogl/pol"],
  ["Ustawa o systemie oswiaty", "https://eli.gov.pl/eli/DU/2025/881/ogl/pol"],
  ["Pomoc psychologiczno-pedagogiczna", "https://eli.gov.pl/eli/DU/2023/1798/ogl"],
  ["Indywidualne nauczanie", "https://eli.gov.pl/eli/DU/2023/2468/ogl"],
  ["Dokumentacja przebiegu nauczania", "https://eli.gov.pl/eli/DU/2024/50/ogl"],
  ["Praktyczna nauka zawodu", "https://eli.gov.pl/eli/DU/2019/391/ogl"],
  ["BHP w szkolach", "https://eli.gov.pl/eli/DU/2020/1604/ogl"],
  ["Ochrona maloletnich", "https://eli.gov.pl/eli/DU/2026/110/ogl"],
].map(([title, url]) => ({ title, url }));

function readSource(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function plainText(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<a id="[^"]+"><\/a>/g, "")
    .replace(/^> ?/gm, "")
    .replace(/[#*_`\\]/g, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function excerpt(text) {
  const compact = plainText(text).replace(/\s+/g, " ");
  return compact.length > 230 ? `${compact.slice(0, 230)}...` : compact;
}

function parseStatuteSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const paragraphMatch = line.match(/^###\s+(§\s*[\da-zA-Z]+\.?.*)/);
    const chapterMatch = line.match(/^##\s+(.+)/);

    if (paragraphMatch) {
      if (current) sections.push(current);
      const title = paragraphMatch[1].replace(/\\\./g, ".").trim();
      current = {
        id: `statute-${sections.length + 1}`,
        title,
        chapter: sections.length ? sections[sections.length - 1].chapter : "Statut",
        body: "",
      };
      continue;
    }

    if (chapterMatch && !line.startsWith("###")) {
      if (current && current.body.trim()) {
        current.body += `\n${line}`;
      }
      continue;
    }

    if (current) current.body += `${line}\n`;
  }

  if (current) sections.push(current);

  let chapter = "Statut";
  return sections.map((section) => {
    const chapterInBody = section.body.match(/##\s+(Rozdział[^\n]+)/);
    if (chapterInBody) chapter = chapterInBody[1].trim();
    return {
      ...section,
      chapter,
      body: plainText(section.body),
    };
  });
}

const docs = sourceFiles.map((item) => {
  const markdown = readSource(item.source);
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const sourceDocx = item.download ? path.basename(item.download) : "";
  const hasDownload = sourceDocx ? fs.existsSync(path.join(publicDocs, sourceDocx)) || item.id === "statut" : false;
  return {
    ...item,
    title: heading || item.title,
    body: plainText(markdown),
    excerpt: excerpt(markdown),
    hasDownload,
    sourcePath: item.source,
  };
});

const statute = docs.find((doc) => doc.id === "statut");
const statuteSections = parseStatuteSections(readSource("Statut_Zespolu_Szkol_Zawodowych_nr_20251015.md"));

const payload = `export const generatedAt = ${JSON.stringify(generatedAt)};

export const documents = ${JSON.stringify(docs, null, 2)} as const;

export const statuteSections = ${JSON.stringify(statuteSections, null, 2)} as const;

export const missingDocuments = ${JSON.stringify(missingDocuments, null, 2)} as const;

export const externalSources = ${JSON.stringify(externalSources, null, 2)} as const;

export const siteStats = {
  documentCount: ${docs.length},
  statuteSectionCount: ${statuteSections.length},
  missingCount: ${missingDocuments.length},
  statuteDownload: ${JSON.stringify(statute?.download ?? "")},
} as const;
`;

fs.writeFileSync(outputPath, payload);
fs.writeFileSync(
  publicData,
  JSON.stringify(
    {
      generatedAt,
      documents: docs,
      statuteSections,
      missingDocuments,
      externalSources,
      siteStats: {
        documentCount: docs.length,
        statuteSectionCount: statuteSections.length,
        missingCount: missingDocuments.length,
        statuteDownload: statute?.download ?? "",
      },
    },
    null,
    2,
  ),
);
console.log(`Generated ${path.relative(siteRoot, outputPath)} with ${docs.length} documents and ${statuteSections.length} statute sections.`);
