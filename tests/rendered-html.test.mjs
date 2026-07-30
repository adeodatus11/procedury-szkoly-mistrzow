import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildInlineDiff, buildTextDiff } from "../app/statute-diff.mjs";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("classifies removed, changed, and newly added statute wording", () => {
  const inline = buildInlineDiff(
    "Dz.U. z 2025 r. poz. 1043",
    "Dz.U. z 2026 r. poz. 820",
  );
  const lines = buildTextDiff("1. Dotychczasowe brzmienie.", "1. Zmienione brzmienie.\n\n2. Nowy ustęp.");

  assert.deepEqual(
    inline.filter((segment) => segment.kind !== "unchanged"),
    [
      { kind: "removed", text: "2025 " },
      { kind: "changed", text: "2026 " },
      { kind: "removed", text: "1043" },
      { kind: "changed", text: "820" },
    ],
  );
  assert.ok(lines[0].segments.some((segment) => segment.kind === "removed"));
  assert.ok(lines[0].segments.some((segment) => segment.kind === "changed"));
  assert.deepEqual(lines[1].segments, [{ kind: "added", text: "2. Nowy ustęp." }]);
});

test("server-renders the ZSZ5 document catalogue", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Procedury Szkoły Mistrzów<\/title>/i);
  assert.match(html, /System dokumentacji ZSZ nr 5/);
  assert.match(html, /27<\/strong><span>dokumentów/);
  assert.match(html, /17<\/strong><span>rozdziałów statutu/);
  assert.match(html, /11<\/strong><span>braków do opracowania/);
  assert.match(html, /Procedura organizacji indywidualnego nauczania/);
  assert.match(html, /Instrukcja kancelaryjna, obiegu dokumentów i archiwizacji dokumentacji szkolnej/);
  assert.match(html, /status-propozycja/);
  assert.match(html, /href="\/dokumenty\/proc-indywidualne-nauczanie-propozycja"/);
  assert.match(html, /href="\/statut\/rozdzial-1-przepisy-definiujace"/);
  assert.match(html, /class="filters"[^]*Instrukcje/);
});

test("keeps generated search data aligned with proposed documents", async () => {
  const data = JSON.parse(await readFile(new URL("../public/search-data.json", import.meta.url), "utf8"));
  const proposals = data.documents.filter((document) => document.status === "propozycja");
  const missingTitles = data.missingDocuments.map((document) => document.title);

  assert.equal(data.documents.length, 27);
  assert.equal(data.siteStats.missingCount, 11);
  assert.equal(data.siteStats.statuteChapterCount, 17);
  assert.equal(data.statuteChapters.length, 17);
  assert.equal(proposals.length, 6);
  assert.equal(data.statuteChapters[0].id, "rozdzial-1-przepisy-definiujace");
  assert.ok(proposals.some((document) => document.id === "ins-kancelaryjna-propozycja"));
  assert.ok(proposals.every((document) => /PROPOZYCJA ROBOCZA/.test(document.body)));
  assert.ok(!missingTitles.includes("Instrukcja kancelaryjna"));
  assert.ok(!missingTitles.includes("Instrukcja obiegu dokumentow"));
  assert.ok(!missingTitles.includes("Instrukcja archiwizacji dokumentacji szkolnej"));
});

test("keeps statute proposals aligned with existing sections and links outside their wording", async () => {
  const data = JSON.parse(await readFile(new URL("../public/search-data.json", import.meta.url), "utf8"));
  const proposals = JSON.parse(await readFile(new URL("../app/statute-proposals-data.json", import.meta.url), "utf8"));
  const sectionIds = new Set(data.statuteChapters.flatMap((chapter) => chapter.sections.map((section) => section.id)));

  assert.equal(Object.keys(proposals.proposals).length, 39);
  assert.ok(Object.keys(proposals.proposals).every((id) => sectionIds.has(id)));
  assert.ok(
    Object.values(proposals.proposals).every((proposal) => {
      const wording = [proposal.title, proposal.body, proposal.rationale].filter(Boolean).join("\n");
      return !/https?:\/\//.test(wording);
    }),
  );
});

test("keeps major-change rationales complete and assigned to existing proposals", async () => {
  const data = JSON.parse(await readFile(new URL("../public/search-data.json", import.meta.url), "utf8"));
  const proposals = JSON.parse(await readFile(new URL("../app/statute-proposals-data.json", import.meta.url), "utf8"));
  const majorChanges = JSON.parse(await readFile(new URL("../app/statute-major-changes.json", import.meta.url), "utf8"));
  const sectionIds = new Set(data.statuteChapters.flatMap((chapter) => chapter.sections.map((section) => section.id)));
  const assignedEntryIds = majorChanges.majorChanges.flatMap((change) => change.entryIds);

  assert.equal(majorChanges.verifiedAsOf, "30 lipca 2026 r.");
  assert.equal(majorChanges.majorChanges.length, 7);
  assert.equal(new Set(assignedEntryIds).size, assignedEntryIds.length);
  assert.ok(assignedEntryIds.every((id) => sectionIds.has(id) && proposals.proposals[id]));
  assert.ok(majorChanges.majorChanges.every((change) => change.entryIds.includes(change.leadEntryId)));
  assert.ok(
    majorChanges.majorChanges.every(
      (change) =>
        change.summary &&
        change.legalBasis &&
        change.editorialDecision &&
        change.sourceShape &&
        change.sources.length >= 4 &&
        change.sources.every((source) => source.kind && source.label && source.url && source.note),
    ),
  );
});

test("server-renders a full proposed procedure page", async () => {
  const response = await render("/dokumenty/proc-indywidualne-nauczanie-propozycja");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Procedura organizacji indywidualnego nauczania/);
  assert.match(html, /To jest propozycja robocza przygotowana na podstawie kwerendy/);
  assert.match(html, /document-reader-full/);
  assert.match(html, /Źródła wykorzystane w kwerendzie/);
});

test("embeds individual teaching templates directly under the attachments section", async () => {
  const response = await render("/dokumenty/proc-indywidualne-nauczanie-propozycja");
  assert.equal(response.status, 200);

  const html = await response.text();
  const sectionStart = html.indexOf("8. Wzory załączników do opracowania");
  const embeddedForms = html.indexOf("Podgląd i pliki do pobrania");
  const sourcesStart = html.indexOf("9. Źródła wykorzystane w kwerendzie");

  assert.ok(sectionStart >= 0);
  assert.ok(embeddedForms > sectionStart);
  assert.ok(sourcesStart > embeddedForms);
  assert.match(html, /href="#zalaczniki">Przejdź do wzorów/);
  assert.match(html, /id="zalaczniki"/);
  assert.match(html, /class="form-inline-thumbnail"/);
  assert.match(html, /Podgląd pierwszej strony: Wniosek o organizację indywidualnego nauczania/);
  assert.match(html, /download="" href="\/docs\/wzory\/PROC_04_Indywidualne_Nauczanie\/01_Wniosek_o_indywidualne_nauczanie\.docx"/);
});

test("server-renders markdown tables as readable HTML tables", async () => {
  const response = await render("/dokumenty/proc-ppp");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<table class="document-table">/);
  assert.match(html, /<th scope="col">Rola<\/th>/);
  assert.match(html, /<td>Dyrektor szkoły<\/td>/);
  assert.doesNotMatch(html, /\| Rola \| Zakres odpowiedzialności \|/);
});

test("server-renders numbered paragraphs and subpoints on separate lines", async () => {
  const response = await render("/dokumenty/proc-ppp");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<p class="structured-line line-ustep">1\. Potrzeba udzielenia PPP/);
  assert.match(html, /<p class="structured-line line-litera">a\) ucznia \(pełnoletniego\);<\/p>/);
  assert.match(html, /<p class="structured-line line-litera">e\) pomocy nauczyciela/);
  assert.doesNotMatch(html, /na wniosek: a\) ucznia/);
});

test("server-renders numbered document sections above indented lists", async () => {
  const response = await render("/dokumenty/proc-skreslenie-propozycja");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<p class="structured-line line-section">5\. Minimalny zestaw dokumentów<\/p>/);
  assert.match(html, /<p class="structured-line line-ustep">1\. Notatka służbowa o zdarzeniu\.<\/p>/);
  assert.match(html, /<p class="structured-line line-section">6\. Wzory załączników do opracowania<\/p>/);
  assert.match(html, /<p class="structured-line line-section">7\. Źródła wykorzystane w kwerendzie<\/p>/);
  assert.match(html, /<p class="structured-line line-ustep">1\. Prawo oświatowe, art\. 68/);
});

test("links legal acts only inside the legal basis section", async () => {
  const response = await render("/dokumenty/proc-skreslenie-propozycja");
  assert.equal(response.status, 200);

  const html = await response.text();
  const legalBasisStart = html.indexOf("2. Podstawa prawna i statutowa");
  const nextSectionStart = html.indexOf("3. Zasady ogólne");
  const sourcesStart = html.indexOf("7. Źródła wykorzystane w kwerendzie");

  assert.ok(legalBasisStart >= 0 && nextSectionStart > legalBasisStart && sourcesStart > nextSectionStart);
  assert.match(html.slice(legalBasisStart, nextSectionStart), /class="legal-link"/);
  assert.doesNotMatch(html.slice(nextSectionStart), /class="legal-link"/);
});

test("server-renders one statute chapter at a time", async () => {
  const response = await render("/statut/rozdzial-1-przepisy-definiujace");
  assert.equal(response.status, 200);

  const html = await response.text();
  const menuStart = html.indexOf('<aside class="reader-toc"');
  const menuEnd = html.indexOf("</aside>", menuStart);
  const menu = html.slice(menuStart, menuEnd);

  assert.match(html, /Rozdział 1\. Przepisy definiujące/);
  assert.match(html, /Aktualne brzmienie/);
  assert.match(html, /Proponowane brzmienie/);
  assert.match(html, /Dz\.U\. z 2025 r\. poz\. 1043/);
  assert.match(html, /statute-diff-removed[^>]*>2025 /);
  assert.match(html, /statute-diff-changed[^>]*>2026 /);
  assert.match(html, /statute-diff-removed[^>]*>1043/);
  assert.match(html, /statute-diff-changed[^>]*>820/);
  assert.match(html, /Legenda oznaczeń zmian/);
  assert.match(html, /39(?:<!-- -->)? paragrafów z propozycją zmiany/);
  assert.match(html, /href="\/statut\/rozdzial-1-przepisy-definiujace" class="active"/);
  assert.doesNotMatch(menu, /paragrafów/);
  assert.doesNotMatch(html, /<h2>§ 136\./);
  assert.doesNotMatch(html, /<h2>§ 140\./);

  const unchangedStart = html.indexOf('id="statute-2"');
  const unchangedProposalStart = html.indexOf("statute-version-proposed", unchangedStart);
  const unchangedEnd = html.indexOf("</section>", unchangedProposalStart);
  assert.doesNotMatch(html.slice(unchangedProposalStart, unchangedEnd), /statute-diff-(?:removed|changed|added)/);
});

test("consolidates detailed PPP provisions into one proposed paragraph", async () => {
  const response = await render("/statut/rozdzial-4-organizacja-pomocy-psychologiczno-pedagogicznej");
  assert.equal(response.status, 200);

  const html = await response.text();
  const consolidatedStart = html.indexOf('id="statute-15"');
  const consolidatedEnd = html.indexOf('id="statute-16"', consolidatedStart);
  const repealedStart = consolidatedEnd;
  const repealedEnd = html.indexOf('id="statute-17"', repealedStart);

  assert.ok(consolidatedStart >= 0 && consolidatedEnd > consolidatedStart && repealedEnd > repealedStart);
  assert.match(html.slice(consolidatedStart, consolidatedEnd), /Procedura udzielania pomocy psychologiczno-pedagogicznej/);
  assert.match(html.slice(repealedStart, repealedEnd), /§ 15\. \(uchylony\)\./);
  assert.match(html.slice(repealedStart, repealedEnd), /statute-diff-removed/);
});

test("proposes one coherent documentation and archival system", async () => {
  const response = await render("/statut/rozdzial-17-przepisy-koncowe");
  assert.equal(response.status, 200);

  const html = await response.text();
  const sectionStart = html.indexOf('id="statute-145"');
  const sectionEnd = html.indexOf('id="statute-146"', sectionStart);
  const section = html.slice(sectionStart, sectionEnd);

  assert.ok(sectionStart >= 0 && sectionEnd > sectionStart);
  assert.match(section, /jeden spójny system kancelaryjny, obiegu dokumentów i archiwizacji dokumentacji szkolnej/);
  assert.match(section, /instrukcję kancelaryjną/);
  assert.match(section, /jednolity rzeczowy wykaz akt/);
  assert.match(section, /instrukcję w sprawie organizacji i zakresu działania składnicy akt/);
  assert.match(section, /Naczelnym Dyrektorem Archiwów Państwowych/);
  assert.match(section, /statute-diff-added/);
});

test("simplifies grading without removing vocational-school specifics", async () => {
  const response = await render(
    "/statut/rozdzial-14-szczegolowe-warunki-i-sposob-oceniania-wewnatrzszkolnego-uczniow",
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  const sectionStart = html.indexOf('id="statute-104"');
  const proposalStart = html.indexOf("statute-version-proposed", sectionStart);
  const sectionEnd = html.indexOf('id="statute-105"', proposalStart);
  const proposal = html.slice(proposalStart, sectionEnd);

  assert.ok(sectionStart >= 0 && proposalStart > sectionStart && sectionEnd > proposalStart);
  assert.match(proposal, /nie jest automatycznym wynikiem średniej arytmetycznej ani ważonej/);
  assert.match(proposal, /kształcenia zawodowego i praktycznej nauki zawodu/);
  assert.match(proposal, /statute-diff-removed[^>]*>1\) celujący 5,75 - 6,00;/);
  assert.match(proposal, /statute-diff-removed[^>]*>3a\. Znak „\+” ma wartość/);
});

test("server-renders the missing documents page after consolidation", async () => {
  const response = await render("/braki");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Braki w dokumentacji statutowej/);
  assert.match(html, /11<\/strong><span>dokumentów do opracowania/);
  assert.match(html, /Dokumenty, dla których przygotowano propozycję/);
  assert.match(html, /href="\/dokumenty\/ins-kancelaryjna-propozycja"/);
  assert.match(html, /href="\/wzory\/archiwum-rejestr-pieczeci"/);
  assert.match(html, /href="\/wzory\/skreslenie-karta-obiegowa"/);
  assert.doesNotMatch(html, /Instrukcja kancelaryjna<\/h3>/);
  assert.match(html, /Instrukcja korzystania z dziennika elektronicznego/);
});

test("server-renders the full form template catalogue", async () => {
  const response = await render("/wzory");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Wzory pism i formularzy/);
  assert.match(html, /35<\/strong><span>wzorów DOCX/);
  assert.match(html, /Skreślenie ucznia/);
  assert.match(html, /Kancelaria i archiwizacja/);
  assert.match(html, /href="\/wzory\/skreslenie-decyzja"/);
  assert.match(html, /href="\/dokumenty\/proc-skreslenie-propozycja"/);
  assert.match(html, /class="form-hover-preview"/);
  assert.match(html, /href="\/previews\/wzory\/skreslenie-notatka-sluzbowa\/page-1\.png"/);
  assert.match(html, /download="" href="\/docs\/wzory\/PROC_03_Skreslenie_Ucznia\/01_Notatka_sluzbowa_o_zdarzeniu\.docx"/);
  assert.match(html, /Podgląd PNG/);
  assert.match(html, /Pobierz DOCX/);
});

test("server-renders a form preview with direct Word download and research links", async () => {
  const response = await render("/wzory/skreslenie-karta-obiegowa");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Karta obiegowa ucznia/);
  assert.match(html, /DO WERYFIKACJI/);
  assert.match(html, /Pobierz plik Word/);
  assert.match(html, /\/docs\/wzory\/PROC_03_Skreslenie_Ucznia\/06_Karta_obiegowa_ucznia\.docx/);
  assert.match(html, /\/previews\/wzory\/skreslenie-karta-obiegowa\/page-1\.png/);
  assert.match(html, /Kodeks postępowania administracyjnego/);
});

test("links proposed form templates from their source procedure", async () => {
  const response = await render("/dokumenty/proc-skreslenie-propozycja");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Podgląd i pliki do pobrania/);
  assert.match(html, /href="\/wzory\/skreslenie-notatka-sluzbowa"/);
  assert.match(html, /href="\/wzory\/skreslenie-decyzja"/);
  assert.match(html, /href="\/previews\/wzory\/skreslenie-notatka-sluzbowa\/page-1\.png"/);
  assert.match(html, /download="" href="\/docs\/wzory\/PROC_03_Skreslenie_Ucznia\/01_Notatka_sluzbowa_o_zdarzeniu\.docx"/);
  assert.match(html, /Pobierz DOCX/);
});

test("server-renders the change center, print report, and ZIP packages", async () => {
  const [changesResponse, printResponse, packagesResponse] = await Promise.all([
    render("/zmiany"),
    render("/zmiany/druk"),
    render("/pakiety"),
  ]);

  assert.equal(changesResponse.status, 200);
  assert.equal(printResponse.status, 200);
  assert.equal(packagesResponse.status, 200);

  const changesHtml = await changesResponse.text();
  const printHtml = await printResponse.text();
  const packagesHtml = await packagesResponse.text();

  assert.match(changesHtml, /Rejestr proponowanych zmian/);
  assert.match(changesHtml, /39<\/strong><span>proponowanych zmian/);
  assert.match(changesHtml, /href="\/statut\/rozdzial-1-przepisy-definiujace\/#statute-1"/);
  assert.match(changesHtml, /Wykaz_proponowanych_zmian_statutu_ZSZ5\.pdf/);
  assert.match(changesHtml, /change-entry-comparison/);
  assert.match(changesHtml, /Aktualne brzmienie/);
  assert.match(changesHtml, /Proponowane brzmienie/);
  assert.match(changesHtml, /statute-diff-removed/);
  assert.match(changesHtml, /statute-diff-changed/);
  assert.match(changesHtml, /statute-diff-added/);
  assert.match(changesHtml, /Przy (?:<!-- -->)?7(?:<!-- -->)? (?:<!-- -->)?zmianach dużego zakresu/);
  assert.equal((changesHtml.match(/class="major-change-justification"/g) ?? []).length, 7);
  assert.match(changesHtml, /Co wynika z prawa/);
  assert.match(changesHtml, /Decyzja redakcyjna/);
  assert.match(changesHtml, /Źródło proponowanego kształtu/);
  assert.match(changesHtml, /Prawo oświatowe, art\. 127 ust\. 20/);
  assert.match(changesHtml, /https:\/\/eli\.gov\.pl\/api\/acts\/DU\/2026\/820\/text\.pdf#page=105/);
  assert.match(changesHtml, /Dokument ZSZ5/);
  assert.match(changesHtml, /data-major-change-reference/);
  assert.match(printHtml, /Wykaz proponowanych zmian statutu/);
  assert.equal((printHtml.match(/class="print-change"/g) ?? []).length, 39);
  assert.equal((printHtml.match(/class="major-change-justification"/g) ?? []).length, 7);
  assert.match(packagesHtml, /Paczki wzorów dokumentów/);
  assert.match(packagesHtml, /wzory-wszystkie\.zip/);
  assert.match(packagesHtml, /35<\/strong><span>wzorów DOCX/);
});

test("builds a global search index covering all content types", async () => {
  const search = JSON.parse(
    await readFile(new URL("../public/global-search-data.json", import.meta.url), "utf8"),
  );
  const types = new Set(search.entries.map((entry) => entry.type));

  assert.equal(search.count, search.entries.length);
  assert.ok(search.entries.length >= 200);
  assert.ok(types.has("Dokument"));
  assert.ok(types.has("Statut"));
  assert.ok(types.has("Wzór pisma"));
  assert.ok(types.has("Brak"));
  assert.ok(types.has("Proponowana zmiana"));
  assert.ok(types.has("Pakiet ZIP"));
  assert.ok(
    search.entries.some(
      (entry) =>
        entry.title === "Wniosek o organizację indywidualnego nauczania" &&
        entry.href === "/wzory/indywidualne-wniosek/",
    ),
  );
});

test("builds the GitHub Pages version with embedded previews and form pages", async () => {
  execFileSync(process.execPath, ["scripts/build-github-pages.mjs"], {
    cwd: new URL("..", import.meta.url),
    stdio: "pipe",
  });

  const procedureHtml = await readFile(
    new URL("../_site/dokumenty/proc-indywidualne-nauczanie-propozycja/index.html", import.meta.url),
    "utf8",
  );
  const formsIndexHtml = await readFile(new URL("../_site/wzory/index.html", import.meta.url), "utf8");
  const formPageHtml = await readFile(
    new URL("../_site/wzory/indywidualne-wniosek/index.html", import.meta.url),
    "utf8",
  );
  const statuteChapterHtml = await readFile(
    new URL("../_site/statut/rozdzial-17-przepisy-koncowe/index.html", import.meta.url),
    "utf8",
  );
  const changesHtml = await readFile(new URL("../_site/zmiany/index.html", import.meta.url), "utf8");
  const packagesHtml = await readFile(new URL("../_site/pakiety/index.html", import.meta.url), "utf8");
  const globalScript = await readFile(new URL("../_site/site.js", import.meta.url), "utf8");

  const sectionStart = procedureHtml.indexOf("8. Wzory załączników do opracowania");
  const embeddedForms = procedureHtml.indexOf("Podgląd i pliki do pobrania");
  const sourcesStart = procedureHtml.indexOf("9. Źródła wykorzystane w kwerendzie");
  const legalBasisStart = procedureHtml.indexOf("2. Podstawa prawna i statutowa");
  const nextSectionStart = procedureHtml.indexOf("3. Uruchomienie procedury");

  assert.ok(sectionStart >= 0 && embeddedForms > sectionStart && sourcesStart > embeddedForms);
  assert.ok(legalBasisStart >= 0 && nextSectionStart > legalBasisStart);
  assert.match(procedureHtml.slice(legalBasisStart, nextSectionStart), /class="legal-link"/);
  assert.doesNotMatch(procedureHtml.slice(sourcesStart), /class="legal-link"/);
  assert.equal((procedureHtml.match(/class="form-inline-thumbnail"/g) ?? []).length, 5);
  assert.equal((procedureHtml.match(/Pobierz DOCX/g) ?? []).length, 5);
  assert.match(procedureHtml, /href="\.\.\/\.\.\/previews\/wzory\/indywidualne-wniosek\/page-1\.png"/);
  assert.match(procedureHtml, /download href="\.\.\/\.\.\/docs\/wzory\/PROC_04_Indywidualne_Nauczanie\/01_Wniosek_o_indywidualne_nauczanie\.docx"/);
  assert.match(formsIndexHtml, /35<\/strong><span>wzorów DOCX/);
  assert.match(formPageHtml, /Wszystkie strony dokumentu/);
  assert.match(statuteChapterHtml, /statute-comparison-row has-proposal/);
  assert.match(statuteChapterHtml, /statute-diff-removed/);
  assert.match(statuteChapterHtml, /statute-diff-changed/);
  assert.match(statuteChapterHtml, /statute-diff-added/);
  assert.match(
    statuteChapterHtml,
    /jeden spójny system kancelaryjny, obiegu dokumentów i archiwizacji dokumentacji szkolnej/,
  );
  assert.match(statuteChapterHtml, /class="major-change-justification"/);
  assert.match(statuteChapterHtml, /Ustawa o narodowym zasobie archiwalnym i archiwach, art\. 6 ust\. 1-2/);
  assert.match(statuteChapterHtml, /data-print-mode="comparison"/);
  assert.equal((changesHtml.match(/class="change-entry /g) ?? []).length, 39);
  assert.equal((changesHtml.match(/class="change-entry-comparison"/g) ?? []).length, 39);
  assert.match(changesHtml, /Aktualne brzmienie/);
  assert.match(changesHtml, /Proponowane brzmienie/);
  assert.match(changesHtml, /statute-diff-removed/);
  assert.match(changesHtml, /statute-diff-changed/);
  assert.match(changesHtml, /statute-diff-added/);
  assert.equal((changesHtml.match(/class="major-change-justification"/g) ?? []).length, 7);
  assert.match(changesHtml, /Źródła przypisane do tej zmiany/);
  assert.match(packagesHtml, /packages\/wzory-wszystkie\.zip/);
  assert.match(globalScript, /global-search-data\.json/);

  execFileSync(process.execPath, ["scripts/audit-site.mjs"], {
    cwd: new URL("..", import.meta.url),
    stdio: "pipe",
  });
});
