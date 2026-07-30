import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = process.cwd();
const source = path.join(root, "_site", "zmiany", "druk", "index.html");
const reportDir = path.join(root, "_site", "reports");
const target = path.join(reportDir, "Wykaz_proponowanych_zmian_statutu_ZSZ5.pdf");

if (!fs.existsSync(source)) {
  throw new Error("Najpierw zbuduj statyczną stronę poleceniem npm run build:static.");
}

fs.mkdirSync(reportDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(pathToFileURL(source).href, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: target,
    format: "A4",
    landscape: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="box-sizing:border-box;color:#555;font-family:Arial,sans-serif;font-size:8px;text-align:center;width:100%;">Strona <span class="pageNumber"></span> z <span class="totalPages"></span></div>',
    margin: {
      top: "12mm",
      right: "12mm",
      bottom: "15mm",
      left: "12mm",
    },
  });
} finally {
  await browser.close();
}

console.log(`Generated ${path.relative(root, target)}`);
