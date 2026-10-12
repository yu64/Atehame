import { ternaryRule } from "./ternary.mjs";
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

ruleTester.run("ternary", ternaryRule, {
  valid: [
    "const a = (x ? 1 : 2);",
    "f(x ? 1 : 2);",
    "const s = `${x ? 1 : 2}`;",
    "const e = <A title={x ? 1 : 2} />;",
    "const e = <div>{(x ? <A /> : <B />)}</div>;",
    "g((x ? 1 : 2), y);",
    lines("const a = (", "  condition", "  ? whenTrue", "  : whenFalse", ");"),
    lines("const a = (", "  x", "  ? (", "    y", "    ? 1", "    : 2", "  )", "  : 3", ");"),
    lines("setStatus(", "  done", "  ? saved", "  : idle", ");"),
  ],
  invalid: [
    {
      code: "const a = x ? 1 : 2;",
      output: "const a = (x ? 1 : 2);",
      errors: [{ messageId: "wrap" }],
    },
    {
      code: "f((x ? 1 : 2));",
      output: "f(x ? 1 : 2);",
      errors: [{ messageId: "unwrap" }],
    },
    {
      // Prettier が = の後で改行した形。
      code: lines("const a =", "  condition", "    ? whenTrue", "    : whenFalse;"),
      output: lines("const a = (", "  condition", "  ? whenTrue", "  : whenFalse", ");"),
      errors: [{ messageId: "layout" }],
    },
    {
      // 入れ子は外側から順に直す（ESLint が直し終わるまで繰り返す）。
      code: lines("const a = x", "  ? 1", "  : y", "    ? 2", "    : 3;"),
      // 1回目は外側だけ。内側は ESLint が次の回で直す（下のテスト）。
      output: lines("const a = (", "  x", "  ? 1", "  : y", "    ? 2", "    : 3", ");"),
      errors: [{ messageId: "layout" }, { messageId: "layout" }],
    },
    {
      code: lines("const a = (", "  x", "  ? 1", "  : y", "    ? 2", "    : 3", ");"),
      output: lines(
        "const a = (",
        "  x",
        "  ? 1",
        "  : (",
        "    y",
        "    ? 2",
        "    : 3",
        "  )",
        ");",
      ),
      errors: [{ messageId: "layout" }],
    },
    {
      // 関数のただ1つの引数は、関数のかっこを使う。末尾のカンマは付けない。
      code: lines("setStatus(", "  done", "    ? saved", "    : idle,", ");"),
      output: lines("setStatus(", "  done", "  ? saved", "  : idle", ");"),
      errors: [{ messageId: "layout" }],
    },
    {
      // JSX（Prettier はかっこ付きで改行する）。1行の JSX はかっこを外す。
      code: lines(
        "const e = (",
        "  <div>",
        "    {loading ? (",
        "      <Spinner />",
        "    ) : (",
        "      <Content />",
        "    )}",
        "  </div>",
        ");",
      ),
      output: lines(
        "const e = (",
        "  <div>",
        "    {(",
        "      loading",
        "      ? <Spinner />",
        "      : <Content />",
        "    )}",
        "  </div>",
        ");",
      ),
      errors: [{ messageId: "layout" }],
    },
    {
      // 複数行の JSX は、かっこで囲んだまま字下げをそろえる。
      code: lines(
        "const e = (",
        "  <div>",
        "    {loading ? (",
        "      <Spinner>",
        "        読み込み中",
        "      </Spinner>",
        "    ) : (",
        "      <Content />",
        "    )}",
        "  </div>",
        ");",
      ),
      output: lines(
        "const e = (",
        "  <div>",
        "    {(",
        "      loading",
        "      ? (",
        "        <Spinner>",
        "          読み込み中",
        "        </Spinner>",
        "      )",
        "      : <Content />",
        "    )}",
        "  </div>",
        ");",
      ),
      errors: [{ messageId: "layout" }],
    },
    {
      // 前の行にコメントがあれば、かっこは引き上げない。
      code: lines("const a =", "  // 説明", "  x", "    ? 1", "    : 2;"),
      output: lines("const a =", "  // 説明", "  (", "    x", "    ? 1", "    : 2", "  );"),
      errors: [{ messageId: "layout" }],
    },
    {
      // 条件と ? の間のコメントは、条件の部分に含めて残す。
      code: lines("const a =", "  x /* 説明 */", "    ? 1", "    : 2;"),
      output: lines("const a = (", "  x /* 説明 */", "  ? 1", "  : 2", ");"),
      errors: [{ messageId: "layout" }],
    },
  ],
});
