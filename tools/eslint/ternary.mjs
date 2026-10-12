// @ts-check
import { hasCommentOutside, hasMultilineTemplate, indentOf, reindent } from "./layout.mjs";
import { isParenthesized } from "@eslint-community/eslint-utils";

/**
 * 三項演算子の書き方をそろえるルール。Prettier で整形した後に --fix で直す前提。
 *
 * - かっこで囲む。1行に収まるなら `(a ? b : c)`。
 * - 複数行なら、かっこの中で条件・`? `・`: ` をそれぞれ行頭にそろえる。
 *   枝がオブジェクトなら、1行に収まっても複数行にする。
 * - 複数行のとき、条件が単純（`isHoge`・`props.isHoge`・`!isHoge`）でなければ、条件もかっこで囲む。
 *   ```
 *   const value = (
 *     (count === 0)
 *     ? whenTrue
 *     : whenFalse
 *   );
 *   ```
 * - すでに括弧の中にある場所（関数のただ1つの引数・JSX の属性）では、自分のかっこは付けず、
 *   外側の括弧をそのまま使う。テンプレートの `${}` の中は1行のまま、かっこも付けない。
 */

/** @typedef {import("eslint").SourceCode} SourceCode */
/** @typedef {import("estree").Node} Node */
/** @typedef {import("estree").ConditionalExpression} ConditionalExpression */
/** @typedef {import("eslint").AST.Token} Token */

/**
 * @typedef {{ kind: "own" } | { kind: "bracket", open: Token, close: Token } | { kind: "inline" }} Placement
 * かっこの付け方。
 * - own: 自分のかっこで囲む
 * - bracket: 外側の括弧（関数の引数の `()`・JSX 属性の `{}`）を使い、自分のかっこは付けない
 * - inline: 1行のまま（テンプレートの `${}`）
 */

// #############################################################################
// MARK: 定数

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
        const hasObjectBranch = [node.consequent, node.alternate].some(
          branch => branch.type === "ObjectExpression",
        );

        // Prettier が `=` の後で改行した（1行に収まらなかった）場合も、複数行の形にする。
        const first = (
          parenthesized
          ? sourceCode.getTokenBefore(node)
          : sourceCode.getFirstToken(node)
        );
        const previous = first && sourceCode.getTokenBefore(first);
        const startsOnNextLine = (
          placement.kind === "own"
          && previous !== null
          && first !== null
          && pullUpAfter.has(previous.value)
          && previous.loc.end.line < first.loc.start.line
        );

        if (singleLine && !hasObjectBranch && !startsOnNextLine) {
          reportSingleLine(node, placement, parenthesized);
          return;
        }
        reportLayout(node, placement, parenthesized);
      },
    };

    /**
     * 1行の三項演算子のかっこを確かめる。
     * @param {ConditionalExpression} node
     * @param {Placement} placement
     * @param {boolean} parenthesized
     */
    function reportSingleLine(node, placement, parenthesized) {
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
    }

    /**
     * 複数行の三項演算子を組み直す。
     * @param {ConditionalExpression} node
     * @param {Placement} placement
     * @param {boolean} parenthesized
     */
    function reportLayout(node, placement, parenthesized) {
      const parts = partsOf(node, sourceCode);
      if (!parts) return;
      const { start, end, open, close, openLine } = replacementOf(node, placement, parenthesized);

      // 置き換える範囲のコメントが、どれかの部分の中にない場合は消えてしまうので直さない。
      const canFix = (
        !hasCommentOutside(
          sourceCode,
          start,
          end,
          parts.map(part => part.range),
        ) && !hasMultilineTemplate(sourceCode, node)
      );

      const base = indentOf(sourceCode, openLine);
      const inner = base + "  ";
      const [test, consequent, alternate] = parts.map((part, index) =>
        reindent(
          part.text,
          (index === 0 ? part.indent : closingIndentOf(part.text, part.indent)),
          inner.length,
        ),
      );
      const wrapTest = !isSimpleCondition(node.test) && !isParenthesized(node.test, sourceCode);
      const text = [
        open,
        `\n${inner}${wrapTest ? `(${test})` : test}`,
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

    /**
     * 置き換える範囲と、開きかっこ・閉じかっこ、開きかっこを置く行。
     * `x =` の後で改行している場合は、`(` を前の行へ引き上げる。
     * @param {ConditionalExpression} node
     * @param {Placement} placement
     * @param {boolean} parenthesized
     */
    function replacementOf(node, placement, parenthesized) {
      if (placement.kind === "bracket") {
        return {
          start: placement.open.range[0],
          end: placement.close.range[1],
          open: placement.open.value,
          close: placement.close.value,
          openLine: placement.open.loc.start.line,
        };
      }

      const [nodeStart, nodeEnd] = /** @type {[number, number]} */ (node.range);
      const before = (parenthesized ? sourceCode.getTokenBefore(node) : undefined);
      const after = (parenthesized ? sourceCode.getTokenAfter(node) : undefined);
      const start = (before ? before.range[0] : nodeStart);
      const end = (after ? after.range[1] : nodeEnd);
      const openLine = sourceCode.getLocFromIndex(start).line;

      const previous = sourceCode.getTokenBefore(
        { range: [start, start] },
        { includeComments: true },
      );
      const canPullUp = (
        previous
        && previous.loc.end.line < openLine
        && previous.type !== "Line"
        && previous.type !== "Block"
        && pullUpAfter.has(previous.value)
      );
      if (previous && canPullUp) {
        return {
          start: previous.range[1],
          end,
          open: " (",
          close: ")",
          openLine: previous.loc.end.line,
        };
      }
      return {
        start,
        end,
        open: "(",
        close: ")",
        openLine,
      };
    }
  },
};

// #############################################################################
// MARK: 内部関数

/**
 * かっこの付け方を、置かれている場所から決める。
 * @param {ConditionalExpression & { parent: Node }} node
 * @param {SourceCode} sourceCode
 * @returns {Placement}
 */
function placementOf(node, sourceCode) {
  const parent = node.parent;
  if (parent.type === "TemplateLiteral") return { kind: "inline" };
  const isOnlyArgument = (
    (parent.type === "CallExpression" || parent.type === "NewExpression")
    && parent.arguments.length === 1
    && parent.arguments[0] === node
  );
  if (isOnlyArgument) {
    const close = sourceCode.getLastToken(parent);
    const open = close && sourceCode.getTokenAfter(parent.callee, token => token.value === "(");
    if (open && close?.value === ")") {
      return {
        kind: "bracket",
        open,
        close,
      };
    }
  }
  // JSX の属性（attr={...}）。
  // @ts-expect-error estree の型には JSX がない
  if (parent.type === "JSXExpressionContainer" && parent.parent?.type === "JSXAttribute") {
    const open = sourceCode.getFirstToken(parent);
    const close = sourceCode.getLastToken(parent);
    if (open && close) {
      return {
        kind: "bracket",
        open,
        close,
      };
    }
  }
  return { kind: "own" };
}

/**
 * 枝の字下げの基準。複数行で閉じかっこ（`}`・`)`・`]`）の行で終わる枝は、その行の字下げを基準にする
 * （Prettier は枝の中身を `? ` の後ろにそろえるため、閉じかっこを `?` の行にそろえ直す）。
 * @param {string} text
 * @param {number} fallback
 */
function closingIndentOf(text, fallback) {
  const lines = text.split("\n");
  const last = lines[lines.length - 1];
  if (lines.length === 1 || !/^\s*[}\])]/.test(last)) return fallback;
  return /^ */.exec(last)?.[0].length ?? fallback;
}

/** かっこで囲まなくても読める単純な条件か（`isHoge`・`props.isHoge`・`!isHoge`）。 */
function isSimpleCondition(/** @type {Node} */ node) {
  if (node.type === "Identifier" || node.type === "ThisExpression") return true;
  if (node.type === "MemberExpression") {
    return !node.computed && isSimpleCondition(/** @type {Node} */ (node.object));
  }
  if (node.type === "UnaryExpression" && node.operator === "!") {
    return isSimpleCondition(node.argument);
  }
  return false;
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
