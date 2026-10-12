// @ts-check
/** @typedef {import("eslint").SourceCode} SourceCode */
/** @typedef {import("estree").Node} Node */

// #############################################################################
// MARK: 関数

/** 行頭の空白。 */
export function indentOf(/** @type {SourceCode} */ sourceCode, /** @type {number} */ line) {
  return /^[ \t]*/.exec(sourceCode.lines[line - 1])?.[0] ?? "";
}

/**
 * 複数行の文字列の字下げを付け替える。1行目は呼び出し側が置く場所に続くので、2行目以降だけずらす。
 * @param {string} text
 * @param {number} from 元の文字列が始まる行の字下げ
 * @param {number} to 新しく置く行の字下げ
 */
export function reindent(text, from, to) {
  const [first, ...rest] = text.split("\n");
  const shifted = rest.map(line => {
    if (line.trim() === "") return "";
    const current = /^ */.exec(line)?.[0].length ?? 0;
    return " ".repeat(Math.max(0, current - from + to)) + line.trimStart();
  });
  return [first, ...shifted].join("\n");
}

/**
 * 2行目以降の最も浅い字下げが to になるようにずらす（`&&` などで始まる続きの行を、1行目にそろえる）。
 * @param {string} text
 * @param {number} to
 */
export function alignContinuation(text, to) {
  const rest = text
    .split("\n")
    .slice(1)
    .filter(line => line.trim() !== "");
  if (rest.length === 0) return text;
  const from = Math.min(...rest.map(line => /^ */.exec(line)?.[0].length ?? 0));
  return reindent(text, from, to);
}

/** 複数行のテンプレート文字列を含むか（字下げを変えると中身が変わるため、直さない）。 */
export function hasMultilineTemplate(
  /** @type {SourceCode} */ sourceCode,
  /** @type {Node} */ node,
) {
  return sourceCode
    .getTokens(node)
    .some(token => token.type === "Template" && token.loc.start.line !== token.loc.end.line);
}

/**
 * 範囲 [start, end) の中に、残す範囲（keep）の外にあるコメントがあるか（置き換えると消えてしまう）。
 * @param {SourceCode} sourceCode
 * @param {number} start
 * @param {number} end
 * @param {Array<[number, number]>} keep
 */
export function hasCommentOutside(sourceCode, start, end, keep) {
  return sourceCode.getAllComments().some(comment => {
    const [from, to] = /** @type {[number, number]} */ (comment.range);
    if (from < start || to > end) return false;
    return !keep.some(([keepFrom, keepTo]) => from >= keepFrom && to <= keepTo);
  });
}
