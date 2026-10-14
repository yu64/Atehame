import { type CssNode, generate, type List, type ListItem, parse, walk } from "css-tree";

// #############################################################################
// MARK: 型定義

export interface SanitizedCss {
  css: string;
  /** 取り除いた記述の説明。作成者に表示する。 */
  warnings: string[];
}

// #############################################################################
// MARK: 定数

/** 外部の読み込みにつながる @ 規則。 */
const blockedAtRules = new Set(["import", "font-face", "namespace", "charset"]);

/** @page の中で使える宣言。用紙サイズと余白だけを許可する。 */
const pageProperties = new Set([
  "size",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
]);

/** 画像などを読み込む関数。通常の url() は Url ノードとして別に判定する。 */
const blockedFunctions = new Set([
  "url",
  "image",
  "image-set",
  "-webkit-image-set",
  "cross-fade",
  "element",
  "-moz-element",
  "paint",
  "src",
]);

// #############################################################################
// MARK: 関数

/**
 * テンプレートの CSS から、外部への通信につながる記述を取り除く。
 * 描画先の iframe でも CSP で通信を禁止しているため、これは多層防御と、作成者への通知のための処理。
 * 正規表現ではなく構文木で判定し、解釈できない記述（Raw）は丸ごと取り除く。
 *
 * maxLength（文字数）を超える CSS は、解析せずにすべて取り除く。
 * どこまで受け付けるかは呼び出し側（レイアウトの方針）が決め、ここはそれを守るだけにする。
 */
export function sanitizeCss(source: string, maxLength: number): SanitizedCss {
  if (source.length > maxLength) {
    return {
      css: "",
      warnings: [`CSS が長すぎます（${maxLength} 文字まで）。`],
    };
  }

  const warnings = new Set<string>();
  const ast = parse(source, {
    positions: false,
    parseValue: true,
    parseCustomProperty: true,
    onParseError: () => warnings.add("解釈できない記述を取り除きました。"),
  });

  // 走査中に取り除くと順番が崩れるため、先に集めてから取り除く。
  // 同じ記述を複数の理由で取り除こうとすることがあるため、項目ごとに1回だけ取り除く。
  const removals = new Map<ListItem<CssNode>, List<CssNode>>();

  walk(ast, {
    enter(node: CssNode, item: ListItem<CssNode>, list: List<CssNode>) {
      if (!list) return;

      if (node.type === "Atrule" && blockedAtRules.has(normalizeName(node.name))) {
        warnings.add(`@${node.name} は使用できません。`);
        removals.set(item, list);
      } else if (node.type === "Atrule" && normalizeName(node.name) === "page") {
        node.block?.children.forEach((child, childItem, childList) => {
          const allowed = (
            child.type === "Declaration" && pageProperties.has(child.property.toLowerCase())
          );
          if (allowed) return;
          warnings.add("@page では size と margin だけが使えます。");
          removals.set(childItem, childList);
        });
      } else if (node.type === "Raw") {
        warnings.add("解釈できない記述を取り除きました。");
        removals.set(item, list);
      } else if (node.type === "Declaration" && node.value.type === "Raw") {
        // 値を解釈できない宣言（例: エスケープで書いた u\72 l(...)）は、ブラウザが別の意味に
        // 解釈するおそれがあるため、宣言ごと取り除く。
        warnings.add(`${node.property} の値を解釈できないため取り除きました。`);
        removals.set(item, list);
      } else if (node.type === "Declaration" && loadsResource(node)) {
        warnings.add(`${node.property} の url() などの外部読み込みは使用できません。`);
        removals.set(item, list);
      }
    },
  });

  for (const [item, list] of removals) list.remove(item);
  return {
    css: generate(ast),
    warnings: [...warnings],
  };
}

/**
 * 名前のエスケープ（例: u\72 l）を戻して小文字にする。
 * ブラウザはエスケープを戻してから解釈するため、判定も同じ形で行う。
 */
export function normalizeName(name: string): string {
  return name
    .replace(/\\([0-9a-fA-F]{1,6})[ \t\n\r\f]?|\\(.)/g, (_, hex: string, char: string) => (
      hex
      ? String.fromCodePoint(parseInt(hex, 16))
      : char
    ),
    )
    .toLowerCase();
}

// #############################################################################
// MARK: 内部関数

/** 外部の資源（url() や @import）を読み込む宣言か。 */
function loadsResource(declaration: CssNode): boolean {
  let found = false;
  walk(declaration, node => {
    if (node.type === "Url") found = true;
    if (node.type === "Function" && blockedFunctions.has(normalizeName(node.name))) found = true;
  });
  return found;
}
