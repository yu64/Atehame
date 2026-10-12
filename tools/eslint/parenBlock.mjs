// @ts-check
import { alignContinuation, hasCommentOutside, hasMultilineTemplate, indentOf } from "./layout.mjs";
import { isParenthesized } from "@eslint-community/eslint-utils";

/**
 * 複数行の条件（`&&`・`||` や比較）を、かっこで囲んで `(` の後と `)` の前で改行するルール。
 * Prettier は `&& (a\n    || b)` や `const x =\n  a\n  || b;` の形にするため、--fix で次の形に組み直す。
 * ```
 * const x = (
 *   a === 0
 *   && (
 *     b === 0
 *     || c === 0
 *   )
 * );
 * ```
 * - すでにかっこで囲んだ式は、複数行なら中の形をそろえる。
 * - かっこのない式は、`=`・`=>`・`:`・JSX の `{` の後で、複数行になるか次の行から始まるならかっこで囲む。
 *   `if (…)` のように構文として括弧がある場所は、Prettier の形のままにする。
 */

/** @typedef {import("eslint").SourceCode} SourceCode */
/** @typedef {import("estree").Node} Node */
/** @typedef {Node & { parent?: Node }} NodeWithParent */

// #############################################################################
// MARK: 定数

/** かっこで囲む式の直前に来てよい記号。この記号の行に `(` を置く。 */
const openAfter = new Set(["=", "=>", ":", "{"]);

/** @type {import("eslint").Rule.RuleModule} */
export const parenBlockRule = {
  meta: {
    type: "layout",
    fixable: "code",
    docs: { description: "複数行の条件はかっこで囲み、( の後と ) の前で改行する" },
    messages: {
      layout: "複数行の条件は、( の後と ) の前で改行し、中を1段下げます。",
      wrap: "複数行の条件は、かっこで囲みます。",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * かっこの付け方と形を確かめる。
     * @param {NodeWithParent} node
     */
    function check(node) {
      if (isParenthesized(node, sourceCode)) {
        checkParenthesized(node);
      } else if (isChainRoot(node) && isWrappablePlace(node)) {
        checkUnparenthesized(node);
      }
    }

    /**
     * かっこで囲んだ複数行の式を組み直す。
     * @param {Node} node
     */
    function checkParenthesized(node) {
      if (node.loc?.start.line === node.loc?.end.line) return;
      const open = sourceCode.getTokenBefore(node);
      const close = sourceCode.getTokenAfter(node);
      if (!open || !close) return;

      const base = indentOf(sourceCode, open.loc.start.line);
      const text = `(${blockBody(node, base)})`;
      replace(node, "layout", [open.range[0], close.range[1]], text);
    }

    /**
     * かっこのない式を、直前の記号の行から始まるかっこで囲む。
     * @param {NodeWithParent} node
     */
    function checkUnparenthesized(node) {
      const previous = sourceCode.getTokenBefore(node, { includeComments: true });
      if (!previous || !openAfter.has(previous.value)) return;
      // `{cond && (<div>…</div>)}` は、複数行なのは表示する JSX で、条件ではないので対象にしない。
      if (rendersJsx(node)) return;
      if (previous.type === "Line" || previous.type === "Block") return;
      const multiline = node.loc?.start.line !== node.loc?.end.line;
      const startsOnNextLine = previous.loc.end.line !== node.loc?.start.line;
      if (!multiline && !startsOnNextLine) return;

      const base = indentOf(sourceCode, previous.loc.end.line);
      const space = (previous.value === "{" ? "" : " ");
      const text = `${space}(${blockBody(node, base)})`;
      const [, nodeEnd] = /** @type {[number, number]} */ (node.range);
      // 直後の行に JSX の閉じ `}` だけが残る場合は、`)}` とつなげる。
      const next = sourceCode.getTokenAfter(node, { includeComments: true });
      const joinsClosingBrace = (
        next?.value === "}" && /^\s*\n\s*$/.test(sourceCode.text.slice(nodeEnd, next.range[0]))
      );
      const end = (next && joinsClosingBrace ? next.range[0] : nodeEnd);
      replace(node, "wrap", [previous.range[1], end], text);
    }

    /**
     * かっこの中身：改行・1段下げた式・改行と閉じかっこの前の字下げ。
     * @param {Node} node
     * @param {string} base かっこの行の字下げ
     */
    function blockBody(node, base) {
      const inner = base + "  ";
      return `\n${inner}${alignContinuation(sourceCode.getText(node), inner.length)}\n${base}`;
    }

    /**
     * 範囲を置き換えるよう知らせる。同じなら何もしない。式の外のコメントが消える場合は直さない。
     * @param {Node} node
     * @param {"layout" | "wrap"} messageId
     * @param {[number, number]} range
     * @param {string} text
     */
    function replace(node, messageId, range, text) {
      if (sourceCode.text.slice(...range) === text) return;
      const canFix = (
        !hasCommentOutside(sourceCode, range[0], range[1], [
          /** @type {[number, number]} */ (node.range),
        ]) && !hasMultilineTemplate(sourceCode, node)
      );
      context.report({
        node,
        messageId,
        fix: (canFix ? fixer => fixer.replaceTextRange(range, text) : null),
      });
    }

    return {
      LogicalExpression: check,
      BinaryExpression: check,
    };
  },
};

// #############################################################################
// MARK: 内部関数

/** 右側が JSX の `&&`（条件に合うときだけ表示する書き方）か。 */
function rendersJsx(/** @type {Node} */ node) {
  if (node.type !== "LogicalExpression") return false;
  const type = /** @type {string} */ (node.right.type);
  return type === "JSXElement" || type === "JSXFragment";
}

/**
 * かっこで囲む場所か：`=` の右辺・アロー関数の本体・オブジェクトの値・JSX の `{}` の中。
 * 三項演算子の条件などは、それぞれのルールに任せる。
 */
function isWrappablePlace(/** @type {NodeWithParent} */ node) {
  const parent = /** @type {NodeWithParent & Record<string, unknown>} */ (node.parent);
  switch (parent?.type) {
    case "VariableDeclarator":
      return parent.init === node;
    case "AssignmentExpression":
      return parent.right === node;
    case "ArrowFunctionExpression":
      return parent.body === node;
    case "Property":
      return parent.value === node;
    default:
      return /** @type {string} */ (parent?.type) === "JSXExpressionContainer";
  }
}

/** `a && b && c` のような連なりの一番外側の式か（内側の `a && b` は対象にしない）。 */
function isChainRoot(/** @type {NodeWithParent} */ node) {
  const parent = node.parent;
  return parent?.type !== "LogicalExpression" && parent?.type !== "BinaryExpression";
}
