import {
  decodeCssString,
  parseTextTemplate,
  splitProperty,
  textProperty,
  type ElementRule,
} from "@src/features/designer/layoutCss";
import {
  formatValue,
  splitTateChuYoko,
  tateChuYokoDigits,
} from "@src/features/designer/render/text";
import type { JsonValue } from "@src/shared/lib/json";

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

/**
 * 部品を1つ組み立てる。見た目と位置はすべて CSS（[data-name="名前"]）で決まる。
 * 値は必ず textContent で入れ、HTML として解釈させない。
 */
export function renderElement(
  doc: Document,
  rule: ElementRule,
  values: Values,
  options: RenderOptions,
): HTMLElement {
  const element = doc.createElement("div");
  element.className = "atehame-element";
  element.dataset.name = rule.name;

  const template = decodeCssString(rule.declarations.get(textProperty)?.value ?? "") ?? "";
  const pieces = fillTemplate(template, values, options);

  if (rule.declarations.get(splitProperty)?.value.trim() === "char") {
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

  const content = doc.createElement("span");
  content.dataset.part = "content";
  const digits = tateChuYokoDigits(rule.declarations.get("text-combine-upright")?.value);
  for (const piece of pieces) {
    if (piece.placeholder) {
      const span = doc.createElement("span");
      span.className = "atehame-placeholder";
      span.textContent = piece.text;
      content.append(span);
      continue;
    }
    for (const run of splitTateChuYoko(piece.text, digits)) {
      if (run.combine) {
        const span = doc.createElement("span");
        span.className = "atehame-tcy";
        span.textContent = run.text;
        content.append(span);
      } else {
        content.append(doc.createTextNode(run.text));
      }
    }
  }
  element.append(content);
  return element;
}

/** {名前} に値を埋め込む。値がない場合、デザイナーでは名前を表示する。 */
function fillTemplate(template: string, values: Values, options: RenderOptions): Piece[] {
  return parseTextTemplate(template).flatMap((segment): Piece[] => {
    if (segment.kind === "text") return [{ text: segment.text, placeholder: false }];
    const text = formatValue(values[segment.key]);
    if (text !== "") return [{ text, placeholder: false }];
    return options.placeholder ? [{ text: `{${segment.key}}`, placeholder: true }] : [];
  });
}
