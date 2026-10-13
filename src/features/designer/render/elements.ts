import { assetDataUrl, type Assets } from "@src/features/designer/assets/assets";
import {
  decodeCssString,
  type ElementRule,
  imageProperty,
  parseTextTemplate,
  splitProperty,
  textProperty,
} from "@src/features/designer/layoutCss";
import {
  formatValue,
  splitTateChuYoko,
  tateChuYokoDigits,
} from "@src/features/designer/render/text";
import type { JsonValue } from "@src/shared/lib/json";

// #############################################################################
// MARK: 型定義

/** 部品に当てはめる値。加工の出力（オブジェクト）。 */
export type Values = Record<string, JsonValue>;

export interface RenderOptions {
  /** 値が空の埋め込みに、値の名前を薄く表示する（デザイナー用）。 */
  placeholder?: boolean;
}

/** 部品の中身の区切り。CSS では [data-part="..."] で指定できる。 */
interface Piece {
  text: string;
  placeholder: boolean;
}

// #############################################################################
// MARK: 関数

/**
 * 部品を1つ組み立てる。見た目と位置はすべて CSS（[data-name="名前"]）で決まる。
 * 値は必ず textContent で入れ、HTML として解釈させない。
 */
export function renderElement(
  doc: Document,
  rule: ElementRule,
  values: Values,
  options: RenderOptions,
  assets: Assets,
): HTMLElement {
  const element = doc.createElement("div");
  element.className = "atehame-element";
  element.dataset.name = rule.name;

  const image = rule.declarations.get(imageProperty);
  if (image !== undefined) {
    renderImage(doc, element, decodeCssString(image.value) ?? "", options, assets);
    return element;
  }

  const template = decodeCssString(rule.declarations.get(textProperty)?.value ?? "") ?? "";
  const pieces = fillTemplate(template, values, options);

  const split = rule.declarations.get(splitProperty)?.value.trim();
  if (split === "char") {
    // 1文字ずつ分ける。郵便番号の枠のように、文字ごとに位置を決める場合に使う。
    for (const piece of pieces) {
      for (const char of piece.text) {
        const span = doc.createElement("span");
        span.dataset.part = "char";
        if (piece.placeholder) span.classList.add("atehame-placeholder");
        span.textContent = char;
        element.append(span);
      }
    }
    return element;
  }

  const digits = tateChuYokoDigits(rule.declarations.get("text-combine-upright")?.value);
  if (split === "line") {
    // 改行ごとに分ける。行ごとの字下げのように、行ごとに位置を決める場合に使う。
    for (const line of splitLines(pieces)) {
      const span = doc.createElement("span");
      span.dataset.part = "line";
      appendPieces(doc, span, line, digits);
      element.append(span);
    }
    return element;
  }

  const content = doc.createElement("span");
  content.dataset.part = "content";
  appendPieces(doc, content, pieces, digits);
  element.append(content);
  return element;
}

// #############################################################################
// MARK: 内部関数

/** 文字を入れる。値のない埋め込みは薄く表示し、短い数字の並びは縦中横にする。 */
function appendPieces(doc: Document, parent: HTMLElement, pieces: Piece[], digits: number) {
  for (const piece of pieces) {
    if (piece.placeholder) {
      const span = doc.createElement("span");
      span.className = "atehame-placeholder";
      span.textContent = piece.text;
      parent.append(span);
      continue;
    }
    for (const run of splitTateChuYoko(piece.text, digits)) {
      if (run.combine) {
        const span = doc.createElement("span");
        span.className = "atehame-tcy";
        span.textContent = run.text;
        parent.append(span);
      } else {
        parent.append(doc.createTextNode(run.text));
      }
    }
  }
}

/** 区切りを、改行ごとの行に分ける。最後が改行で終わる場合も、その後ろの空の行は作らない。 */
function splitLines(pieces: Piece[]): Piece[][] {
  const lines: Piece[][] = [[]];
  for (const piece of pieces) {
    for (const [index, text] of piece.text.split("\n").entries()) {
      if (index > 0) lines.push([]);
      if (text !== "") {
        lines[lines.length - 1].push({
          ...piece,
          text,
        });
      }
    }
  }
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

/**
 * 画像を表示する。src は登録した画像から検証して組み立てた data: URL だけを使う。
 * 画像が見つからなければ、デザイナーでは名前を薄く表示し、印刷では何も表示しない。
 */
function renderImage(
  doc: Document,
  element: HTMLElement,
  name: string,
  options: RenderOptions,
  assets: Assets,
) {
  const asset = (Object.hasOwn(assets, name) ? assets[name] : undefined);
  const url = (asset ? assetDataUrl(asset) : undefined);
  if (url === undefined) {
    if (!options.placeholder) return;
    const span = doc.createElement("span");
    span.dataset.part = "content";
    span.className = "atehame-placeholder";
    span.textContent = `画像がありません（${name}）`;
    element.append(span);
    return;
  }
  const img = doc.createElement("img");
  img.dataset.part = "image";
  img.alt = "";
  img.draggable = false;
  img.src = url;
  element.append(img);
}

/** {名前} に値を埋め込む。値がない場合、デザイナーでは名前を表示する。 */
function fillTemplate(template: string, values: Values, options: RenderOptions): Piece[] {
  return parseTextTemplate(template).flatMap((segment): Piece[] => {
    if (segment.kind === "text") {
      return [
        {
          text: segment.text,
          placeholder: false,
        },
      ];
    }
    const text = formatValue(values[segment.key]);
    if (text !== "") {
      return [
        {
          text,
          placeholder: false,
        },
      ];
    }
    return (
      options.placeholder
      ? [
        {
          text: `{${segment.key}}`,
          placeholder: true,
        },
      ]
      : []
    );
  });
}
