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
  assert.match(html, /11<\/strong><span>braków do opracowania/);
  assert.match(html, /Procedura organizacji indywidualnego nauczania/);
  assert.match(html, /Instrukcja kancelaryjna, obiegu dokumentów i archiwizacji dokumentacji szkolnej/);
  assert.match(html, /status-propozycja/);
  assert.match(html, /class="filters"[^]*Instrukcje/);
});

test("keeps generated search data aligned with proposed documents", async () => {
  const data = JSON.parse(await readFile(new URL("../public/search-data.json", import.meta.url), "utf8"));
  const proposals = data.documents.filter((document) => document.status === "propozycja");
  const missingTitles = data.missingDocuments.map((document) => document.title);

  assert.equal(data.documents.length, 27);
  assert.equal(data.siteStats.missingCount, 11);
  assert.equal(proposals.length, 6);
  assert.ok(proposals.some((document) => document.id === "ins-kancelaryjna-propozycja"));
  assert.ok(proposals.every((document) => /PROPOZYCJA ROBOCZA/.test(document.body)));
  assert.ok(!missingTitles.includes("Instrukcja kancelaryjna"));
  assert.ok(!missingTitles.includes("Instrukcja obiegu dokumentow"));
  assert.ok(!missingTitles.includes("Instrukcja archiwizacji dokumentacji szkolnej"));
});

test("server-renders the missing documents page after consolidation", async () => {
  const response = await render("/braki");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Braki w dokumentacji statutowej/);
  assert.match(html, /11<\/strong><span>dokumentów do opracowania/);
  assert.doesNotMatch(html, /Instrukcja kancelaryjna<\/h3>/);
  assert.match(html, /Instrukcja korzystania z dziennika elektronicznego/);
});
