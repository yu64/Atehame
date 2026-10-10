import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { chromium } from "playwright";
import { createServer } from "vite";

// 描画処理で組み立てた文書を Chrome で PDF にし、ページ数と用紙サイズを確認する。
// 各ページの画像を temp/print-check に保存するので、見た目も確認できる。
const root = fileURLToPath(new URL("./", import.meta.url));
const outDir = fileURLToPath(new URL("../../temp/print-check/", import.meta.url));
const mmToPt = 72 / 25.4;
const papers = { hagaki: [100, 148], nagagata3: [120, 235] };

/** PDF の圧縮された描画命令をつなげて返す。 */
function pdfContent(pdf) {
  const text = pdf.toString("latin1");
  let content = "";
  for (const match of text.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
    try {
      content += inflateSync(Buffer.from(match[1], "latin1")).toString("latin1");
    } catch {
      // 圧縮されていない、または画像などの読めないストリームは飛ばす。
    }
  }
  return content;
}

await mkdir(outDir, { recursive: true });
const server = await createServer({
  configFile: false,
  root,
  logLevel: "error",
  resolve: { alias: { "@src": fileURLToPath(new URL("../../src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  const harness = await browser.newPage();
  await harness.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
  await harness.waitForFunction(() => Boolean(window.buildPrintHtml));
  const rowCount = await harness.evaluate(() => window.rowCount);

  for (const [preset, [width, height]] of Object.entries(papers)) {
    const html = await harness.evaluate(p => window.buildPrintHtml(p), preset);
    const page = await browser.newPage();
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);

    // 印刷（@page の用紙サイズ）で PDF にする。背景のグラフィックはブラウザの既定と同じく切る。
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
    await writeFile(`${outDir}${preset}.pdf`, pdf);
    const text = pdf.toString("latin1");
    const pages = text.match(/\/Type\s*\/Page\b/g) ?? [];
    assert.equal(pages.length, rowCount, `${preset}: ページ数`);
    const box = text.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
    assert.ok(box, `${preset}: MediaBox`);
    assert.ok(Math.abs(Number(box[1]) - width * mmToPt) < 1, `${preset}: 幅 ${box[1]}pt`);
    assert.ok(Math.abs(Number(box[2]) - height * mmToPt) < 1, `${preset}: 高さ ${box[2]}pt`);

    // 画面表示でも外部への通信がないことと、使われたフォントを確認する。
    const requests = [];
    page.on("request", request => requests.push(request.url()));
    await page.setViewportSize({ width: 1200, height: 1400 });
    const shots = await page.locator(".atehame-page").all();
    for (const [index, shot] of shots.entries()) {
      await shot.screenshot({ path: `${outDir}${preset}-${index + 1}.png` });
    }
    const fonts = await page.evaluate(() =>
      [...document.querySelectorAll(".atehame-element")].map(
        el => getComputedStyle(el).fontFamily.split(",")[0],
      ),
    );
    assert.deepEqual(
      requests.filter(url => !url.startsWith("data:") && url !== "about:blank"),
      [],
    );

    console.log(`${preset}: ${pages.length} pages, ${box[1]}x${box[2]}pt, font=${fonts[0]}`);
    await page.close();
  }

  // 背景のグラフィックを切った印刷でも、作成者の CSS の背景色が印刷される。
  const html = await harness.evaluate(
    css => window.buildPrintHtml("hagaki", css),
    '[data-name="宛名"] { background: #ff0000; }',
  );
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false });
  assert.match(pdfContent(pdf), /1 0 0 rg/, "背景色が印刷される");
  console.log("background: printed");
} finally {
  await browser.close();
  await server.close();
}
