// @ts-check
/**
 * プロパティが2つ以上あるオブジェクトは、1行に1つずつ並べるルール。
 * `{` の直後に改行を入れるだけで、残りの改行は Prettier（objectWrap: "preserve"）が入れる。
 */

// #############################################################################
// MARK: 定数

/** 1行に並べてよいプロパティの数。 */
const maxPropertiesOnOneLine = 1;

/** @type {import("eslint").Rule.RuleModule} */
export const objectNewlineRule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
    docs: { description: "プロパティが2つ以上あるオブジェクトは、1行に1つずつ並べる" },
    messages: {
      newline: "プロパティが2つ以上あるオブジェクトは、1行に1つずつ並べます。",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      ObjectExpression(node) {
        if (node.properties.length <= maxPropertiesOnOneLine) return;
        const open = sourceCode.getFirstToken(node);
        const first = open && sourceCode.getTokenAfter(open, { includeComments: true });
        if (!open || !first || first.loc.start.line !== open.loc.end.line) return;
        context.report({
          node,
          messageId: "newline",
          fix: fixer => fixer.replaceTextRange([open.range[1], first.range[0]], "\n"),
        });
      },
    };
  },
};
