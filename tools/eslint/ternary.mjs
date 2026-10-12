// @ts-check
import { isParenthesized } from "@eslint-community/eslint-utils";

/**
 * 三項演算子の書き方をそろえるルール。Prettier で整形した後に --fix で直す前提。
 *
 * - かっこで囲む。1行に収まるなら `(a ? b : c)`。
 * - 複数行なら、かっこの中で条件・`? `・`: ` をそれぞれ行頭にそろえる。
 *   ```
 *   const value = (
 *     condition
 *     ? whenTrue
 *     : whenFalse
 *   );
 *   ```
 * - すでに括弧の中にある場所（関数のただ1つの引数・JSX の属性）では、自分のかっこは付けず、
 *   外側の括弧をそのまま使う。テンプレートの `${}` の中は1行のまま、かっこも付けない。
 */

/** @typedef {import("eslint").Rule.RuleContext} RuleContext */
/** @typedef {import("eslint").SourceCode} SourceCode */
/** @typedef {import("estree").Node} Node */
/** @typedef {import("estree").ConditionalExpression} ConditionalExpression */
/** @typedef {import("eslint").AST.Token} Token */

// =============================================================================
// MARK: 場所の判定

/**
 * かっこの付け方。
 * - own: 自分のかっこで囲む
 * - bracket: 外側の括弧（関数の引数の `()`・JSX 属性の `{}`）を使い、自分のかっこは付けない
 * - inline: 1行のまま（テンプレートの `${}`）
 * @param {ConditionalExpression & { parent: Node }} node
 * @returns {{ kind: "own" } | { kind: "bracket", open: Token, close: Token } | { kind: "inline" }}
 */
function placementOf(node, /** @type {SourceCode} */ sourceCode) {
  const parent = node.parent;
  if (parent.type === "TemplateLiteral") return { kind: "inline" };
  if (
    (parent.type === "CallExpression" || parent.type === "NewExpression") &&
    parent.arguments.length === 1 &&
    parent.arguments[0] === node
  ) {
    const close = sourceCode.getLastToken(parent);
    const open = close && sourceCode.getTokenAfter(parent.callee, token => token.value === "(");
    if (open && close?.value === ")") return { kind: "bracket", open, close };
  }
  // JSX の属性（attr={...}）。
  // @ts-expect-error estree の型には JSX がない
  if (parent.type === "JSXExpressionContainer" && parent.parent?.type === "JSXAttribute") {
    const open = sourceCode.getFirstToken(parent);
    const close = sourceCode.getLastToken(parent);
    if (open && close) return { kind: "bracket", open, close };
  }
  return { kind: "own" };
}

// =============================================================================
// MARK: 組み立て

/** 行頭の空白。 */
function indentOf(/** @type {SourceCode} */ sourceCode, /** @type {number} */ line) {
  return /^[ \t]*/.exec(sourceCode.lines[line - 1])?.[0] ?? "";
}

/**
 * 複数行の部分の字下げを付け替える。1行目は呼び出し側が置く場所に続くので、2行目以降だけずらす。
 * @param {string} text
 * @param {number} from 元の部分が始まる行の字下げ
 * @param {number} to 新しく置く行の字下げ
 */
function reindent(text, from, to) {
  const [first, ...rest] = text.split("\n");
  const shifted = rest.map(line => {
    if (line.trim() === "") return "";
    const current = /^ */.exec(line)?.[0].length ?? 0;
    return " ".repeat(Math.max(0, current - from + to)) + line.trimStart();
  });
  return [first, ...shifted].join("\n");
}

/**
 * 条件・真・偽のそれぞれの文字列（かっこやコメントを含む）と、始まる行の字下げ。
 * @param {ConditionalExpression} node
 * @param {SourceCode} sourceCode
 */
function partsOf(node, sourceCode) {
  const question = sourceCode.getTokenAfter(
    /** @type {Node} */ (node.test),
    token => token.type === "Punctuator" && token.value === "?",
  );
  const colon = sourceCode.getTokenAfter(
    /** @type {Node} */ (node.consequent),
    token => token.type === "Punctuator" && token.value === ":",
  );
  if (!question || !colon) return undefined;
  const [start, end] = /** @type {[number, number]} */ (node.range);
  const ranges = [
    [start, question.range[0]],
    [question.range[1], colon.range[0]],
    [colon.range[1], end],
  ];
  const nodes = [node.test, node.consequent, node.alternate];
  return ranges.map(([from, to], index) => {
    const raw = sourceCode.text.slice(from, to);
    const textStart = from + (raw.length - raw.trimStart().length);
    const range = /** @type {[number, number]} */ ([textStart, textStart + raw.trim().length]);
    const line = sourceCode.getLocFromIndex(textStart).line;
    return {
      text: unwrapSingleLineJsx(sourceCode, /** @type {Node} */ (nodes[index]), range),
      range,
      indent: indentOf(sourceCode, line).length,
    };
  });
}

/**
 * Prettier は三項演算子の枝の JSX をかっこで囲む。1行の JSX なら、かっこを外した文字列を返す
 * （複数行の JSX は、入れ子の三項演算子と同じく `? (` … `)` の形で残す）。
 * @param {SourceCode} sourceCode
 * @param {Node} node
 * @param {[number, number]} range かっこやコメントを含む、枝の範囲
 */
function unwrapSingleLineJsx(sourceCode, node, range) {
  const text = sourceCode.text.slice(...range);
  const type = /** @type {string} */ (node.type);
  if (type !== "JSXElement" && type !== "JSXFragment") return text;
  if (node.loc?.start.line !== node.loc?.end.line) return text;
  // かっことその間の空白だけなら外す（コメントがあれば残す）。
  const nodeText = sourceCode.getText(node);
  const [before, after] = text.split(nodeText);
  if (/^\(\s*$/.test(before ?? "") && /^\s*\)$/.test(after ?? "")) return nodeText;
  return text;
}

/** 複数行のテンプレート文字列を含むか（字下げを変えると中身が変わるため、直さない）。 */
function hasMultilineTemplate(/** @type {SourceCode} */ sourceCode, /** @type {Node} */ node) {
  return sourceCode
    .getTokens(node)
    .some(token => token.type === "Template" && token.loc.start.line !== token.loc.end.line);
}

// =============================================================================
// MARK: ルール

/** 前の行から `(` を引き上げてよい直前の記号（`=` の後で改行しない）。 */
const pullUpAfter = new Set(["=", "=>", "return", ":", "??", "||", "&&"]);

/** @type {import("eslint").Rule.RuleModule} */
export const ternaryRule = {
  meta: {
    type: "layout",
    fixable: "code",
    docs: { description: "三項演算子をかっこで囲み、複数行なら ? と : を行頭にそろえる" },
    messages: {
      wrap: "三項演算子はかっこで囲みます。",
      unwrap: "ここでは三項演算子にかっこを付けません（外側の括弧を使います）。",
      layout: "複数行の三項演算子は、条件・? ・: をそれぞれ行頭にそろえます。",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ConditionalExpression(node) {
        const placement = placementOf(node, sourceCode);
        if (placement.kind === "inline") return;

        const parenthesized = isParenthesized(node, sourceCode);
        const singleLine = node.loc?.start.line === node.loc?.end.line;

        if (singleLine) {
          if (placement.kind === "own" && !parenthesized) {
            context.report({
              node,
              messageId: "wrap",
              fix: fixer => [fixer.insertTextBefore(node, "("), fixer.insertTextAfter(node, ")")],
            });
          }
          if (placement.kind === "bracket" && parenthesized) {
            const open = sourceCode.getTokenBefore(node);
            const close = sourceCode.getTokenAfter(node);
            context.report({
              node,
              messageId: "unwrap",
              fix: (open && close ? fixer => [fixer.remove(open), fixer.remove(close)] : null),
            });
          }
          return;
        }

        report(node, placement, parenthesized);
      },
    };

    /**
     * 複数行の三項演算子を組み直す。
     * @param {ConditionalExpression} node
     * @param {ReturnType<typeof placementOf>} placement
     * @param {boolean} parenthesized
     */
    function report(node, placement, parenthesized) {
      const parts = partsOf(node, sourceCode);
      if (!parts) return;
      const [nodeStart, nodeEnd] = /** @type {[number, number]} */ (node.range);

      // 置き換える範囲と、開きかっこを置く行。
      /** @type {number} */ let start;
      /** @type {number} */ let end;
      /** @type {string} */ let open;
      /** @type {string} */ let close;
      /** @type {number} */ let openLine;
      if (placement.kind === "bracket") {
        start = placement.open.range[0];
        end = placement.close.range[1];
        open = placement.open.value;
        close = placement.close.value;
        openLine = placement.open.loc.start.line;
      } else {
        const before = (parenthesized ? sourceCode.getTokenBefore(node) : undefined);
        const after = (parenthesized ? sourceCode.getTokenAfter(node) : undefined);
        start = (before ? before.range[0] : nodeStart);
        end = (after ? after.range[1] : nodeEnd);
        open = "(";
        close = ")";
        openLine = sourceCode.getLocFromIndex(start).line;

        // `x =` の後で改行している場合は、`(` を前の行へ引き上げる。
        const previous = sourceCode.getTokenBefore(
          { range: [start, start] },
          { includeComments: true },
        );
        if (
          previous &&
          previous.loc.end.line < openLine &&
          previous.type !== "Line" &&
          previous.type !== "Block" &&
          pullUpAfter.has(previous.value)
        ) {
          start = previous.range[1];
          open = " (";
          openLine = previous.loc.end.line;
        }
      }

      // 置き換える範囲のコメントが、どれかの部分の中にない場合は消えてしまうので直さない。
      const lostComment = sourceCode.getAllComments().some(comment => {
        const [from, to] = /** @type {[number, number]} */ (comment.range);
        if (from < start || to > end) return false;
        return !parts.some(({ range }) => from >= range[0] && to <= range[1]);
      });
      const canFix = !lostComment && !hasMultilineTemplate(sourceCode, node);

      const base = indentOf(sourceCode, openLine);
      const inner = base + "  ";
      const [test, consequent, alternate] = parts.map(part =>
        reindent(part.text, part.indent, inner.length),
      );
      const text = [
        open,
        `\n${inner}${test}`,
        `\n${inner}? ${consequent}`,
        `\n${inner}: ${alternate}`,
        `\n${base}${close}`,
      ].join("");

      if (sourceCode.text.slice(start, end) === text) return;
      context.report({
        node,
        messageId: "layout",
        fix: (canFix ? fixer => fixer.replaceTextRange([start, end], text) : null),
      });
    }
  },
};
