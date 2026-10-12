import { parenBlockRule } from "./parenBlock.mjs";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

/** 行の配列を1つの文字列にする（字下げを読みやすく書くため）。 */
function lines(...rows: string[]) {
  return rows.join("\n");
}

ruleTester.run("paren-block", parenBlockRule, {
  valid: [
    "const a = x && (y || z);",
    // 右側が JSX の && は、条件ではなく表示する JSX が複数行なだけなので対象外。
    lines(
      "const e = (",
      "  <div>",
      "    {loading && (",
      "      <Spinner />",
      "    )}",
      "  </div>",
      ");",
    ),
    // 構文として括弧がある場所は、Prettier の形のまま。
    lines("if (", "  x", "  && y", ") {", "}"),
    lines("const a = (", "  x === 0", "  && (", "    y === 0", "    || z === 0", "  )", ");"),
  ],
  invalid: [
    {
      // かっこの中の条件を、Prettier の形から組み直す。
      code: lines("if (", "  x === 0", "  && (y === 0", "    || z === 0)", ") {", "}"),
      output: lines(
        "if (",
        "  x === 0",
        "  && (",
        "    y === 0",
        "    || z === 0",
        "  )",
        ") {",
        "}",
      ),
      errors: [{ messageId: "layout" }],
    },
    {
      // = の後で改行した条件は、かっこで囲む。
      code: lines(
        "const onScrollbar =",
        "  event.offsetX >= area.clientWidth",
        "  || event.offsetY >= area.clientHeight;",
      ),
      output: lines(
        "const onScrollbar = (",
        "  event.offsetX >= area.clientWidth",
        "  || event.offsetY >= area.clientHeight",
        ");",
      ),
      errors: [{ messageId: "wrap" }],
    },
    {
      // 1行でも、次の行から始まるならかっこで囲む。
      code: lines("const invalid =", "  !Number.isInteger(timeoutMs) || timeoutMs < 1;"),
      output: lines("const invalid = (", "  !Number.isInteger(timeoutMs) || timeoutMs < 1", ");"),
      errors: [{ messageId: "wrap" }],
    },
    {
      // アロー関数の本体。
      code: lines(
        "items.find(",
        "  item =>",
        "    item.width < 1",
        "    && item.height < 1,",
        ");",
      ),
      output: lines(
        "items.find(",
        "  item => (",
        "    item.width < 1",
        "    && item.height < 1",
        "  ),",
        ");",
      ),
      errors: [{ messageId: "wrap" }],
    },
    {
      // JSX の属性のアロー関数。閉じの } は ) につなげる。
      code: lines(
        "const e = (",
        "  <Input",
        "    onChange={width =>",
        "      width >= 10",
        "      && change(width)",
        "    }",
        "  />",
        ");",
      ),
      output: lines(
        "const e = (",
        "  <Input",
        "    onChange={width => (",
        "      width >= 10",
        "      && change(width)",
        "    )}",
        "  />",
        ");",
      ),
      errors: [{ messageId: "wrap" }],
    },
  ],
});
