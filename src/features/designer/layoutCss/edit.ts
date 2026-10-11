import { encodeCssString } from "@src/features/designer/layoutCss/cssString";
import {
  dataNameOf,
  parseCss,
  parseLayoutCss,
  type ElementRule,
  type LayoutCss,
  type RuleInfo,
  type TextRange,
} from "@src/features/designer/layoutCss/parse";
import {
  expandRuleRange,
  replaceRange,
  replaceRanges,
} from "@src/features/designer/layoutCss/ranges";
import { walk } from "css-tree";

/**
 * レイアウトの CSS を部分的に書き換える。対象の範囲だけを置き換え、
 * それ以外の記述（コメント、改行、書き方）はそのまま残す。
 */

export type RuleTarget = { element: string } | { page: true };

/** 部品を指定するセレクタ。 */
export function selectorFor(name: string): string {
  return `[data-name=${encodeCssString(name)}]`;
}

function findRule(layout: LayoutCss, target: RuleTarget): RuleInfo | undefined {
  return "page" in target
    ? layout.page
    : layout.elements.find(element => element.name === target.element);
}

/** 規則の中の最初の宣言の字下げ。なければ2文字。 */
function indentOf(css: string, rule: RuleInfo): string {
  const body = css.slice(rule.bodyRange.start, rule.bodyRange.end);
  return body.match(/\n([ \t]+)\S/)?.[1] ?? "  ";
}

/**
 * 宣言の値を設定する。value が undefined なら宣言を取り除く。
 * 宣言がなければ規則の末尾に追加し、@page の規則がなければ先頭に作る。
 * parsed は css の解析結果（解析済みなら渡すと解析を省ける。以下の関数も同じ）。
 */
export function setDeclaration(
  css: string,
  target: RuleTarget,
  property: string,
  value: string | undefined,
  parsed: LayoutCss = parseLayoutCss(css),
): string {
  const rule = findRule(parsed, target);
  if (!rule) {
    if (!("page" in target) || value === undefined) return css;
    return `@page {\n  ${property}: ${value};\n}\n\n${css}`;
  }

  const existing = rule.declarations.get(property);
  if (existing) {
    return value === undefined
      ? removeDeclarationText(css, existing.range, rule.bodyRange)
      : replaceRange(css, existing.valueRange, value);
  }
  if (value === undefined) return css;

  const indent = indentOf(css, rule);
  const body = css.slice(rule.bodyRange.start, rule.bodyRange.end);
  if (body.trim() === "") {
    return replaceRange(css, rule.bodyRange, `\n${indent}${property}: ${value};\n`);
  }

  // 最後の宣言の直後に追加する（入れ子の規則があれば、その前）。直前に ; がなければ補う。
  let contentEnd = rule.bodyRange.start + body.trimEnd().length;
  if (rule.declarationsEnd !== undefined) {
    contentEnd = rule.declarationsEnd;
    while (/[ \t]/.test(css[contentEnd])) contentEnd++;
    if (css[contentEnd] === ";") contentEnd++;
  }
  const previous = css[contentEnd - 1];
  const separator = previous === ";" || contentEnd === rule.bodyRange.start ? "" : ";";
  return (
    css.slice(0, contentEnd) +
    `${separator}\n${indent}${property}: ${value};` +
    css.slice(contentEnd)
  );
}

/** 複数の宣言をまとめて設定する。 */
export function setDeclarations(
  css: string,
  target: RuleTarget,
  entries: Array<[property: string, value: string | undefined]>,
): string {
  return entries.reduce(
    (current, [property, value]) => setDeclaration(current, target, property, value),
    css,
  );
}

/** 宣言を、後ろの ; とその行の残りの空白も含めて取り除く。 */
function removeDeclarationText(css: string, range: TextRange, body: TextRange): string {
  let end = range.end;
  while (end < body.end && /[ \t]/.test(css[end])) end++;
  if (css[end] === ";") end++;

  let start = range.start;
  // 行の先頭から始まる宣言なら、行ごと取り除く。
  const lineStart = css.lastIndexOf("\n", start - 1) + 1;
  if (lineStart > body.start && css.slice(lineStart, start).trim() === "") {
    start = lineStart;
    while (end < body.end && /[ \t]/.test(css[end])) end++;
    if (css[end] === "\n") end++;
  }
  return replaceRange(css, { start, end }, "");
}

/**
 * 部品の規則を末尾に追加する。nestedCss は規則の中、宣言の後ろに入れ子で書く
 * （`& > [data-part="char"] { … }` など、中身の調整用）。
 */
export function addElementRule(
  css: string,
  name: string,
  declarations: Array<[property: string, value: string]>,
  nestedCss = "",
): string {
  const lines = declarations.map(([property, value]) => `  ${property}: ${value};`);
  if (nestedCss.trim() !== "") {
    const nested = nestedCss
      .trim()
      .split("\n")
      .map(line => (line.trim() === "" ? "" : `  ${line}`));
    lines.push(...(lines.length > 0 ? [""] : []), ...nested);
  }
  const rule = `${selectorFor(name)} {\n${lines.join("\n")}\n}\n`;
  const prefix = css.trim() === "" ? "" : `${css.trimEnd()}\n\n`;
  return `${prefix}${rule}`;
}

/** 部品の名前を変える。その名前を指定しているすべてのセレクタを書き換える。 */
export function renameElement(css: string, from: string, to: string): string {
  if (from === to) return css;
  const ranges: TextRange[] = [];
  walk(parseCss(css), {
    visit: "AttributeSelector",
    enter(node) {
      if (dataNameOf(node) !== from || !node.value?.loc) return;
      ranges.push({ start: node.value.loc.start.offset, end: node.value.loc.end.offset });
    },
  });
  return replaceRanges(css, ranges, encodeCssString(to));
}

/** 部品の規則を直後に複製し、名前と位置（mm）を変える。 */
export function duplicateElementRule(
  css: string,
  name: string,
  newName: string,
  offset: { left: number; top: number },
  parsed: LayoutCss = parseLayoutCss(css),
): string {
  const rule = findRule(parsed, { element: name });
  if (!rule) return css;

  const source = css.slice(rule.range.start, rule.range.end);
  const selectorEnd = source.indexOf("{");
  const copy = `${selectorFor(newName)} ${source.slice(selectorEnd)}`;
  const inserted = `${css.slice(0, rule.range.end)}\n\n${copy}${css.slice(rule.range.end)}`;
  return setDeclarations(inserted, { element: newName }, [
    ["left", formatMm(offset.left)],
    ["top", formatMm(offset.top)],
  ]);
}

/** 部品の規則を、部品の中で最前面（最後）か最背面（最初）に移す。 */
export function moveElementRule(
  css: string,
  name: string,
  to: "front" | "back",
  parsed: LayoutCss = parseLayoutCss(css),
): string {
  const elements = parsed.elements;
  const rule = elements.find(element => element.name === name);
  if (!rule) return css;

  const anchor: ElementRule | undefined = to === "front" ? elements.at(-1) : elements[0];
  if (!anchor || anchor === rule) return css;

  const text = css.slice(rule.range.start, rule.range.end);
  // 部品の規則だけを移す。部品を指定するほかの規則（中身の調整など）はそのまま残す。
  const removed = replaceRange(css, expandRuleRange(css, rule.range), "");
  const anchorRule = parseLayoutCss(removed).elements.find(element => element.name === anchor.name);
  if (!anchorRule) return css;

  return to === "front"
    ? `${removed.slice(0, anchorRule.range.end)}\n\n${text}${removed.slice(anchorRule.range.end)}`
    : `${removed.slice(0, anchorRule.range.start)}${text}\n\n${removed.slice(anchorRule.range.start)}`;
}

/** mm の数値を CSS の長さにする（0.01mm 単位）。 */
export function formatMm(value: number): string {
  return `${Math.round(value * 100) / 100}mm`;
}
