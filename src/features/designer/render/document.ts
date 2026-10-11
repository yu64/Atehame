import type { LayoutDocument } from "@src/features/designer/layoutCss";
import { paperSizeOf } from "@src/features/designer/model";
import {
  renderElement,
  type RenderOptions,
  type Values,
} from "@src/features/designer/render/elements";
import { defaultFont, fontVariables } from "@src/features/designer/render/fonts";
import { sanitizeCss } from "@src/features/designer/render/sanitizeCss";

/**
 * 描画用の iframe に設定する属性。スクリプトは実行させず、
 * 親から内容を組み立てられるよう同一オリジンとし、印刷のためにダイアログを許可する。
 */
export const renderFrameSandbox = "allow-same-origin allow-modals";

/** 描画用の文書の CSP。外部への通信を一切許可しない。 */
export const renderFrameCsp =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:";

const fontCss = Object.values(fontVariables)
  .map(font => `${font.variable}: ${font.family};`)
  .join(" ");

/**
 * 基本の CSS。:where() で詳細度を 0 にし、作成者の CSS で必ず上書きできるようにする。
 * 部品は縦に並ぶ flex にしてあり、justify-content で枠の中の揃えを変えられる。
 * ブラウザの印刷は既定で背景色や背景画像を省くため、print-color-adjust で書いたとおりに印刷させる。
 */
const baseCss = `
:root { ${fontCss} }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
:where(html) { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
:where(.atehame-page) { position: relative; overflow: hidden; background: #fff; }
:where(.atehame-element) {
  position: absolute; left: 0; top: 0; box-sizing: border-box;
  display: flex; flex-direction: column;
  font-family: var(${fontVariables[defaultFont].variable});
  white-space: pre-wrap; overflow-wrap: anywhere;
}
:where(.atehame-tcy) { text-combine-upright: all; }
:where(.atehame-placeholder) { color: #9ca3af; }
@media print {
  .atehame-page { break-after: page; }
  .atehame-page:last-child { break-after: auto; }
}
`;

/** 描画用の iframe の srcdoc。中身は親が DOM で組み立てる。 */
export function createDocumentHtml(): string {
  return [
    "<!doctype html>",
    '<html lang="ja"><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${renderFrameCsp}">`,
    `<style id="atehame-base">${baseCss}</style>`,
    '<style id="atehame-paper"></style>',
    '<style id="atehame-author"></style>',
    "</head><body></body></html>",
  ].join("");
}

/** 用紙の大きさと、作成者の CSS（安全化済み）を文書に設定する。取り除いた記述の警告を返す。 */
export function applyLayoutStyles(doc: Document, layout: LayoutDocument): string[] {
  const { width, height } = paperSizeOf(layout);
  // 作成者が @page で余白を指定しなければ 0 にする。作成者の CSS が後に来るため上書きできる。
  setStyle(
    doc,
    "atehame-paper",
    `@page { size: ${width}mm ${height}mm; margin: 0; }\n` +
      `.atehame-page { width: ${width}mm; height: ${height}mm; }`,
  );

  const sanitized = sanitizeCss(layout.css);
  setStyle(doc, "atehame-author", sanitized.css);
  return sanitized.warnings;
}

function setStyle(doc: Document, id: string, css: string) {
  let style = doc.getElementById(id);
  if (!style) {
    style = doc.createElement("style");
    style.id = id;
    doc.head.append(style);
  }
  // CSS は文字列として設定し、HTML としては解釈させない。
  if (style.textContent !== css) style.textContent = css;
}

/** 1ページ分の要素を組み立てる。部品は CSS の記述順に並べる。 */
export function renderPage(
  doc: Document,
  layout: LayoutDocument,
  values: Values,
  options: RenderOptions = {},
): HTMLElement {
  const page = doc.createElement("div");
  page.className = "atehame-page";
  for (const rule of layout.elements) {
    page.append(renderElement(doc, rule, values, options));
  }
  return page;
}

/** 行ごとに1ページずつ組み立て、文書の本文を置き換える。 */
export function renderPages(
  doc: Document,
  layout: LayoutDocument,
  rows: Values[],
  options: RenderOptions = {},
): void {
  const pages = rows.map(values => renderPage(doc, layout, values, options));
  doc.body.replaceChildren(...pages);
}
