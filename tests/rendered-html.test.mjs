import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("server-renders a full proposed procedure page", async () => {
  const response = await render("/dokumenty/proc-indywidualne-nauczanie-propozycja");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Procedura organizacji indywidualnego nauczania/);
  assert.match(html, /To jest propozycja robocza przygotowana na podstawie kwerendy/);
  assert.match(html, /document-reader-full/);
  assert.match(html, /Źródła wykorzystane w kwerendzie/);
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
  assert.match(html, /<p class="structured-line line-ustep">1\. <a class="legal-link"[^>]*>Prawo oświatowe<\/a>, art\. 68/);
});

test("server-renders one statute chapter at a time", async () => {
  const response = await render("/statut/rozdzial-1-przepisy-definiujace");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Rozdział 1\. Przepisy definiujące/);
  assert.match(html, /Wyświetlany jest tylko jeden rozdział/);
  assert.match(html, /href="\/statut\/rozdzial-1-przepisy-definiujace" class="active"/);
  assert.doesNotMatch(html, /paragrafów/);
  assert.doesNotMatch(html, /<h2>§ 136\./);
  assert.doesNotMatch(html, /<h2>§ 140\./);
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
  assert.match(html, /Propozycje wzorów pism i formularzy/);
  assert.match(html, /href="\/wzory\/skreslenie-notatka-sluzbowa"/);
  assert.match(html, /href="\/wzory\/skreslenie-decyzja"/);
  assert.match(html, /Podgląd PNG i plik Word do pobrania/);
});
