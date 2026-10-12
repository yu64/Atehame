import { lengthToMm } from "@src/shared/lib/units";
import { type AttributeSelector, type CssNode, type Declaration, parse, type Rule } from "css-tree";

/**
 * レイアウトの CSS の約束事。
 * - 最上位にあり、セレクタが [data-name="名前"] だけの規則を「部品」とみなす。
 * - 部品に表示する文字は --atehame-text、1文字ずつ分けるかは --atehame-split で指定する。
 * - 画像の部品は --atehame-image で、レイアウトに登録した画像の名前を指定する。
 * - 用紙サイズは @page の size で指定する。
 */
export const textProperty = "--atehame-text";
export const splitProperty = "--atehame-split";
export const imageProperty = "--atehame-image";

export interface TextRange {
  start: number;
  end: number;
}

/** 用紙の大きさ（mm）。 */
export interface PageSize {
  width: number;
  height: number;
}

export interface DeclarationInfo {
  property: string;
  /** 値の文字列（前後の空白やコメント、!important は含まない）。 */
  value: string;
  important: boolean;
  /** 宣言全体の範囲。 */
  range: TextRange;
  /** 値の範囲。 */
  valueRange: TextRange;
}

export interface RuleInfo {
  /** 規則全体の範囲。 */
  range: TextRange;
  /** { の直後から } の直前までの範囲。 */
  bodyRange: TextRange;
  /** 同じプロパティが複数ある場合は、CSS と同じく後ろのものを使う。 */
  declarations: Map<string, DeclarationInfo>;
  /**
   * 入れ子の規則（& … { } など）がある場合、最初の入れ子より前にある最後の宣言の終わり。
   * 宣言を追加するときは、入れ子より前のここに書く。入れ子がなければ undefined。
   */
  declarationsEnd?: number;
}

export interface ElementRule extends RuleInfo {
  name: string;
}

export interface LayoutCss {
  /** 部品の定義。CSS の記述順（＝描画の重なり順）。同じ名前の規則が複数あれば最初のもの。 */
  elements: ElementRule[];
  /** @page の規則（最初のもの）。 */
  page?: RuleInfo;
}

/**
 * 位置付きで CSS を解析する。書きかけの CSS も解析できる範囲で読む。
 * カスタムプロパティの値は書いたままの文字列（Raw）にする。
 */
export function parseCss(css: string): CssNode {
  return parse(css, { positions: true, parseCustomProperty: false, onParseError: () => {} });
}

/** [data-name=…] なら、その値（部品の名前）を返す。 */
export function dataNameOf(node: AttributeSelector): string | undefined {
  if (node.name.name !== "data-name" || !node.value) return undefined;
  return (node.value.type === "String" ? node.value.value : node.value.name);
}

/** レイアウトの CSS を解析する。書きかけの CSS も解析できる範囲で読む。 */
export function parseLayoutCss(css: string): LayoutCss {
  const ast = parseCss(css);

  const elements: ElementRule[] = [];
  const names = new Set<string>();
  let page: RuleInfo | undefined;

  if (ast.type !== "StyleSheet") return { elements };

  ast.children.forEach(node => {
    if (node.type === "Atrule" && node.name.toLowerCase() === "page" && node.block && !page) {
      const info = readRule(css, node, node.block);
      if (info) page = info;
      return;
    }
    if (node.type !== "Rule") return;

    const name = elementNameOf(node);
    if (name === undefined || names.has(name)) return;
    const info = readRule(css, node, node.block);
    if (!info) return;
    names.add(name);
    elements.push({ ...info, name });
  });

  return { elements, page };
}

/** セレクタが [data-name="名前"] だけの規則なら、その名前を返す。 */
function elementNameOf(rule: Rule): string | undefined {
  const prelude = rule.prelude;
  if (prelude.type !== "SelectorList" || prelude.children.size !== 1) return undefined;
  const selector = prelude.children.first;
  if (selector?.type !== "Selector" || selector.children.size !== 1) return undefined;

  const attribute = selector.children.first;
  if (attribute?.type !== "AttributeSelector" || attribute.matcher !== "=" || attribute.flags) {
    return undefined;
  }
  return dataNameOf(attribute);
}

function readRule(css: string, node: CssNode, block: CssNode): RuleInfo | undefined {
  if (!node.loc || !block.loc || block.type !== "Block") return undefined;

  const declarations = new Map<string, DeclarationInfo>();
  let lastDeclarationEnd = block.loc.start.offset + 1;
  let declarationsEnd: number | undefined;
  block.children.forEach(child => {
    if (child.type !== "Declaration") {
      if (declarationsEnd === undefined && child.type !== "Raw") {
        declarationsEnd = lastDeclarationEnd;
      }
      return;
    }
    const info = readDeclaration(css, child);
    if (!info) return;
    declarations.set(info.property, info);
    if (declarationsEnd === undefined) lastDeclarationEnd = info.range.end;
  });

  return {
    range: { start: node.loc.start.offset, end: node.loc.end.offset },
    bodyRange: { start: block.loc.start.offset + 1, end: block.loc.end.offset - 1 },
    declarations,
    declarationsEnd,
  };
}

function readDeclaration(css: string, node: Declaration): DeclarationInfo | undefined {
  if (!node.loc) return undefined;
  const property = (node.property.startsWith("--") ? node.property : node.property.toLowerCase());

  let valueRange: TextRange | undefined;
  const value = node.value;
  if (value.type === "Raw" && value.loc) {
    // カスタムプロパティなどの値。前後の空白を除く。
    const raw = css.slice(value.loc.start.offset, value.loc.end.offset);
    const start = value.loc.start.offset + (raw.length - raw.trimStart().length);
    valueRange = { start, end: start + raw.trim().length };
  } else if (value.type === "Value") {
    // 値の中の最初と最後の要素の位置を使い、後ろのコメントや空白を含めない。
    const first = value.children.first?.loc;
    const last = value.children.last?.loc;
    if (first && last) valueRange = { start: first.start.offset, end: last.end.offset };
  }
  if (!valueRange) return undefined;

  return {
    property,
    value: css.slice(valueRange.start, valueRange.end),
    important: node.important !== false,
    range: { start: node.loc.start.offset, end: node.loc.end.offset },
    valueRange,
  };
}

const namedPageSizes: Record<string, [number, number]> = {
  a3: [297, 420],
  a4: [210, 297],
  a5: [148, 210],
  b4: [250, 353],
  b5: [176, 250],
  "jis-b4": [257, 364],
  "jis-b5": [182, 257],
  letter: [215.9, 279.4],
  legal: [215.9, 355.6],
};

/** @page の size から用紙の大きさ（mm）を読む。読めない場合は undefined。 */
export function readPageSize(layout: LayoutCss): PageSize | undefined {
  const size = layout.page?.declarations.get("size")?.value;
  if (!size) return undefined;

  const words = size.trim().toLowerCase().split(/\s+/);
  const orientation = words.find(word => word === "portrait" || word === "landscape");
  const rest = words.filter(word => word !== orientation);

  let width: number | undefined;
  let height: number | undefined;
  if (rest.length === 1 && namedPageSizes[rest[0]]) {
    [width, height] = namedPageSizes[rest[0]];
  } else if (rest.length === 1 || rest.length === 2) {
    width = lengthToMm(rest[0]);
    height = lengthToMm(rest[1] ?? rest[0]);
  }
  if (!width || !height || width <= 0 || height <= 0) return undefined;

  const swap =
    (orientation === "landscape" ? width < height : orientation === "portrait" && width > height);
  return (swap ? { width: height, height: width } : { width, height });
}
