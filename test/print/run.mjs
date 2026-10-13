import { boundsOfColor, mmToPt, readFills, readPages } from "./pdf.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

// 描画処理で組み立てた文書を Chrome で PDF にし、次のことを確認する。
// - ページ数と用紙の大きさ
// - 部品の位置と大きさが、画面での表示（デザイナーで見ている位置）と mm 単位で一致すること
// - 外部への通信がないこと、背景を切った印刷でも作成者の背景色が印刷されること
// 各ページの PDF と画像を temp/print-check に保存するので、見た目も確認できる。

// #############################################################################
// MARK: 定数

const root = fileURLToPath(new URL("./", import.meta.url));
const outDir = fileURLToPath(new URL("../../temp/print-check/", import.meta.url));

/** 用紙の大きさ（mm）。 */
const papers = {
  hagaki: [100, 148],
  nagagata3: [120, 235],
};

/**
 * 位置のずれの許容（mm）。Chrome は背景の塗りを CSS ピクセル単位に丸めて描くため、
 * 部品の位置が正しくても塗りの端は最大 0.5px（約 0.13mm）ずれる。
 */
const toleranceMm = 0.15;

/** 1mm あたりの CSS ピクセル数。 */
const mmToPx = 96 / 25.4;

// #############################################################################
// MARK: 内部関数

/**
 * 部品ごとに見分けられる塗りの色（0〜1 の RGB）。白と黒は使わない。
 * @param {number} index
 * @returns {[number, number, number]}
 */
function markerColor(index) {
  const n = index + 1;
  return [Math.floor(n / 36) % 6, Math.floor(n / 6) % 6, n % 6].map(level => level / 5);
}

/**
 * 部品に見分けるための背景色を付ける CSS。作成者の CSS より優先する。
 * @param {number} count 部品の数
 */
function markerCss(count) {
  return Array.from({ length: count }, (_, index) => {
    const [r, g, b] = markerColor(index).map(value => Math.round(value * 255));
    return `.atehame-element:nth-child(${index + 1}) { background: rgb(${r} ${g} ${b}) !important; }`;
  }).join("\n");
}

/**
 * 画面の表示での、ページごとの部品の位置（ページの左上からの mm）。
 * @param {import("playwright").Page} page
 */
function measureScreen(page) {
  return page.evaluate(
    mmToPx =>
      [...document.querySelectorAll(".atehame-page")].map(pageElement => {
        const origin = pageElement.getBoundingClientRect();
        return [...pageElement.querySelectorAll(":scope > .atehame-element")].map(element => {
          const rect = element.getBoundingClientRect();
          return {
            name: element.getAttribute("data-name") ?? "",
            left: (rect.left - origin.left) / mmToPx,
            top: (rect.top - origin.top) / mmToPx,
            right: (rect.right - origin.left) / mmToPx,
            bottom: (rect.bottom - origin.top) / mmToPx,
          };
        });
      }),
    mmToPx,
  );
}

/**
 * 2つの位置が許容の範囲で一致することを確かめる。
 * @param {{ left: number, top: number, right: number, bottom: number }} actual
 * @param {{ left: number, top: number, right: number, bottom: number }} expected
 * @param {string} label
 */
function assertRect(actual, expected, label) {
  for (const side of /** @type {const} */ (["left", "top", "right", "bottom"])) {
    const diff = Math.abs(actual[side] - expected[side]);
    assert.ok(
      diff <= toleranceMm,
      `${label}: ${side} が ${actual[side].toFixed(2)}mm（期待 ${expected[side].toFixed(2)}mm）`,
    );
  }
}

// #############################################################################
// MARK: 実行

await mkdir(outDir, { recursive: true });
const server = await createServer({
  configFile: false,
  root,
  logLevel: "error",
  resolve: { alias: { "@src": fileURLToPath(new URL("../../src", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: 0,
  },
});
await server.listen();
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

try {
  const harness = await browser.newPage();
  await harness.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
  await harness.waitForFunction(() => Boolean(window.buildPrintHtml));
  const rowCount = await harness.evaluate(() => window.rowCount);

  for (const [preset, [width, height]] of Object.entries(papers)) {
    const html = await harness.evaluate(p => window.buildPrintHtml(p), preset);
    const page = await browser.newPage();
    const requests = [];
    page.on("request", request => requests.push(request.url()));
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);

    // 印刷（@page の用紙サイズ）で PDF にする。背景のグラフィックはブラウザの既定と同じく切る。
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: false,
    });
    await writeFile(`${outDir}${preset}.pdf`, pdf);
    const pages = readPages(pdf);
    assert.equal(pages.length, rowCount, `${preset}: ページ数`);
    for (const pdfPage of pages) {
      assert.ok(Math.abs(pdfPage.width - width * mmToPt) < 1, `${preset}: 幅 ${pdfPage.width}pt`);
      assert.ok(
        Math.abs(pdfPage.height - height * mmToPt) < 1,
        `${preset}: 高さ ${pdfPage.height}pt`,
      );
    }

    // 画面での見た目を保存する。
    await page.setViewportSize({
      width: 1200,
      height: 1400,
    });
    for (const [index, shot] of (await page.locator(".atehame-page").all()).entries()) {
      await shot.screenshot({ path: `${outDir}${preset}-${index + 1}.png` });
    }
    const fonts = await page.evaluate(() =>
      [...document.querySelectorAll(".atehame-element")].map(
        el => getComputedStyle(el).fontFamily.split(",")[0],
      ),
    );

    // 部品に色を付けて PDF にし、塗りの位置を画面での位置と比べる。
    const screen = await measureScreen(page);
    await page.addStyleTag({
      content: markerCss(Math.max(...screen.map(elements => elements.length))),
    });
    const marked = readPages(
      await page.pdf({
        preferCSSPageSize: true,
        printBackground: false,
      }),
    );
    for (const [pageIndex, elements] of screen.entries()) {
      const fills = readFills(marked[pageIndex].content, marked[pageIndex].height);
      for (const [index, element] of elements.entries()) {
        const label = `${preset} ${pageIndex + 1}ページ「${element.name}」`;
        const printed = boundsOfColor(fills, markerColor(index));
        assert.ok(printed, `${label}: 印刷されていない`);
        assertRect(printed, element, label);
      }
    }

    // 画面での位置が、レイアウトに書いた mm のとおりであること（住所: left: 幅 - 30mm; top: 25mm; width: 14mm）。
    const address = screen[0].find(element => element.name === "住所");
    assert.ok(address, `${preset}: 住所の部品`);
    assertRect(
      address,
      {
        left: width - 30,
        top: 25,
        right: width - 16,
        bottom: 25 + height * 0.6,
      },
      `${preset}: 住所の指定`,
    );

    assert.deepEqual(
      requests.filter(url => !url.startsWith("data:") && url !== "about:blank"),
      [],
    );
    const count = screen.reduce((sum, elements) => sum + elements.length, 0);
    console.log(
      `${preset}: ${pages.length} pages, ${pages[0].width}x${pages[0].height}pt, `
        + `${count} elements within ${toleranceMm}mm, font=${fonts[0]}`,
    );
    await page.close();
  }

  // 背景のグラフィックを切った印刷でも、作成者の CSS の背景色が印刷される。
  const html = await harness.evaluate(
    css => window.buildPrintHtml("hagaki", css),
    '[data-name="宛名"] { background: #ff0000; }',
  );
  const page = await browser.newPage();
  await page.setContent(html);
  const [first] = readPages(
    await page.pdf({
      preferCSSPageSize: true,
      printBackground: false,
    }),
  );
  assert.ok(boundsOfColor(readFills(first.content, first.height), [1, 0, 0]), "背景色が印刷される");
  console.log("background: printed");
} finally {
  await browser.close();
  await server.close();
}
