import {
  dataNameOf,
  parseCss,
  parseLayoutCss,
  type LayoutCss,
  type TextRange,
} from "@src/features/designer/layoutCss/parse";
import { expandRuleRange, replaceRanges } from "@src/features/designer/layoutCss/ranges";
import { walk, type CssNode, type List } from "css-tree";

/**
 * 部品を取り除く。部品の規則に加えて、その部品だけを指定する規則（@media などの中も含む）と、
 * その直前のコメントも取り除く。ほかの部品と並べて指定しているセレクタは、その部分だけ取り除く。
 * 中身が空になった @media などの規則も取り除く。
 */
export function removeElementRule(
  css: string,
  name: string,
  parsed: LayoutCss = parseLayoutCss(css),
): string {
  if (!parsed.elements.some(element => element.name === name)) return css;
  const ast = parseCss(css);
  if (ast.type !== "StyleSheet") return css;
  return replaceRanges(css, collectRemovals(css, ast.children, name).ranges, "");
}

/** 並んだ規則のうち、取り除く範囲。all はすべての規則を取り除くか。 */
function collectRemovals(
  css: string,
  children: List<CssNode>,
  name: string,
): { ranges: TextRange[]; all: boolean } {
  const ranges: TextRange[] = [];
  let count = 0;
  let removed = 0;

  children.forEach(node => {
    if (!node.loc) return;
    const whole = { start: node.loc.start.offset, end: node.loc.end.offset };

    if (node.type === "Atrule") {
      if (!node.block || node.name.toLowerCase() === "page") return;
      count++;
      const inner = collectRemovals(css, node.block.children, name);
      if (inner.all) {
        removed++;
        ranges.push(expandRuleRange(css, whole));
      } else {
        ranges.push(...inner.ranges);
      }
      return;
    }
    if (node.type !== "Rule") return;
    count++;

    const selectors = node.prelude.type === "SelectorList" ? node.prelude.children.toArray() : [];
    const matched = selectors.map(selector => referencesElement(selector, name));
    if (matched.length > 0 && matched.every(Boolean)) {
      removed++;
      ranges.push(expandRuleRange(css, whole));
      return;
    }
    if (matched.some(Boolean) && selectors.every(selector => selector.loc)) {
      ranges.push(...selectorRemovals(selectors, matched));
    }
    // ほかの部品の規則の中に入れ子で書いた規則も調べる。
    ranges.push(...collectRemovals(css, node.block.children, name).ranges);
  });

  return { ranges, all: count > 0 && removed === count };
}

/** 並んだセレクタのうち、指定のものだけを間の , も含めて取り除く範囲。 */
function selectorRemovals(selectors: CssNode[], matched: boolean[]): TextRange[] {
  const ranges: TextRange[] = [];
  const lastKept = matched.lastIndexOf(false);
  selectors.forEach((selector, index) => {
    if (!matched[index] || index > lastKept) return;
    ranges.push({ start: selector.loc!.start.offset, end: selectors[index + 1].loc!.start.offset });
  });
  if (lastKept < selectors.length - 1) {
    ranges.push({
      start: selectors[lastKept].loc!.end.offset,
      end: selectors.at(-1)!.loc!.end.offset,
    });
  }
  return ranges;
}

/** セレクタが [data-name="名前"] を含むか。:not() の中は「その部品以外」なので数えない。 */
function referencesElement(selector: CssNode, name: string): boolean {
  let found = false;
  walk(selector, {
    enter(node: CssNode) {
      if (node.type === "PseudoClassSelector" && node.name.toLowerCase() === "not") {
        return walk.skip;
      }
      if (node.type === "AttributeSelector" && dataNameOf(node) === name) found = true;
    },
  });
  return found;
}
