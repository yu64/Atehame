import type { TextRange } from "@src/features/designer/layoutCss/parse";

/** 範囲を文字列で置き換える。 */
export function replaceRange(css: string, range: TextRange, text: string): string {
  return css.slice(0, range.start) + text + css.slice(range.end);
}

/** 重ならない複数の範囲を置き換える。後ろから置き換え、前の位置がずれないようにする。 */
export function replaceRanges(css: string, ranges: TextRange[], text: string): string {
  return [...ranges]
    .sort((a, b) => b.start - a.start)
    .reduce((current, range) => replaceRange(current, range, text), css);
}

/**
 * 規則ごと取り除く範囲を、直前のコメント（空行を挟まないもの）と、前後の空白・改行まで広げる。
 */
export function expandRuleRange(css: string, range: TextRange): TextRange {
  let start = range.start;
  for (;;) {
    const before = css.slice(0, start).trimEnd();
    const between = css.slice(before.length, start);
    if (!before.endsWith("*/") || (between.match(/\n/g)?.length ?? 0) > 1) break;
    // コメントは入れ子にならないため、直前のコメントの終わりより後の最初の /* が始まり。
    const previousEnd = css.lastIndexOf("*/", before.length - 3);
    const commentStart = css.indexOf("/*", previousEnd < 0 ? 0 : previousEnd + 2);
    if (commentStart < 0 || commentStart >= before.length - 2) break;
    start = commentStart;
  }
  const lineStart = css.lastIndexOf("\n", start - 1) + 1;
  if (css.slice(lineStart, start).trim() === "") start = lineStart;

  let end = range.end;
  while (end < css.length && /[ \t]/.test(css[end])) end++;
  if (css[end] === "\n") end++;
  // 規則の後の空行を1つ取り除く。
  if (css[end] === "\n") end++;
  // 末尾の規則なら、前の規則との間の空行も取り除く。
  if (end >= css.length && start > 0) {
    start = Math.min(start, css.slice(0, start).trimEnd().length + 1);
  }
  return { start, end };
}
