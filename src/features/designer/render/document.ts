import {
  decodeCssString,
  imageProperty,
  type LayoutDocument,
} from "@src/features/designer/layoutCss";
import { paperSizeOf } from "@src/features/designer/model";
import {
  renderElement,
  type RenderOptions,
  type Values,
} from "@src/features/designer/render/elements";
import { defaultFont, fontVariables } from "@src/features/designer/render/fonts";
import { sanitizeCss } from "@src/features/designer/render/sanitizeCss";
import { createIsolatedFrameHtml, setStyleText } from "@src/shared/lib/frame/isolatedFrame";

// #############################################################################
// MARK: 文書の準備

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
:where(.atehame-element > [data-part="image"]) {
  position: absolute; inset: 0; width: 100%; height: 100%; display: block;
  object-fit: inherit; object-position: inherit;
}
:where(.atehame-placeholder) { color: #9ca3af; }
@media print {
  .atehame-page { break-after: page; }
  .atehame-page:last-child { break-after: auto; }
}
`;

/**
 * 描画用の iframe の srcdoc。外部への通信を禁止した文書に、基本の CSS と、
 * 用紙・作成者の CSS を後から入れる場所を用意する。中身は親が DOM で組み立てる。
 */
export function createDocumentHtml(): string {
  return createIsolatedFrameHtml({
    styles: [
      { id: "atehame-base", css: baseCss },
      { id: "atehame-paper" },
      { id: "atehame-author" },
    ],
  });
}

/** 用紙の大きさと、作成者の CSS（安全化済み）を文書に設定する。取り除いた記述の警告を返す。 */
export function applyLayoutStyles(doc: Document, layout: LayoutDocument): string[] {
  const { width, height } = paperSizeOf(layout);
  // 作成者が @page で余白を指定しなければ 0 にする。作成者の CSS が後に来るため上書きできる。
  setStyleText(
    doc,
    "atehame-paper",
    `@page { size: ${width}mm ${height}mm; margin: 0; }\n` +
      `.atehame-page { width: ${width}mm; height: ${height}mm; }`,
  );

  const sanitized = sanitizeCss(layout.css);
  setStyleText(doc, "atehame-author", sanitized.css);
  return [...sanitized.warnings, ...missingAssetWarnings(layout)];
}

// #############################################################################
// MARK: 警告

/**
 * レイアウトの警告。安全化で取り除く記述と、登録されていない画像。
 * 描画と同じ確認を、描画せずに行う（保存の前の確認などで使う）。
 */
export function layoutDocumentWarnings(layout: LayoutDocument): string[] {
  return [...sanitizeCss(layout.css).warnings, ...missingAssetWarnings(layout)];
}

/** 部品が参照している画像のうち、登録されていないものの警告。 */
function missingAssetWarnings(layout: LayoutDocument): string[] {
  const names = new Set(
    layout.elements
      .map(element => element.declarations.get(imageProperty)?.value)
      .filter(value => value !== undefined)
      .map(value => decodeCssString(value) ?? ""),
  );
  return [...names]
    .filter(name => !Object.hasOwn(layout.assets, name))
    .map(name => `画像「${name}」が登録されていません。`);
}

// #############################################################################
// MARK: 描画

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
    page.append(renderElement(doc, rule, values, options, layout.assets));
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
