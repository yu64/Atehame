import { objectNewlineRule } from "./objectNewline.mjs";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

ruleTester.run("object-newline", objectNewlineRule, {
  valid: [
    "const a = { css };",
    "const a = {};",
    "const a = {\n  id: 1,\n  name: 2,\n};",
    // 分割代入や型は対象外。
    "const { a, b } = value;",
    "type A = { a: string; b: number };",
  ],
  invalid: [
    {
      // { の直後に改行を入れる（残りは Prettier が整える）。
      code: 'const a = { id: "address", name: "住所" };',
      output: 'const a = {\nid: "address", name: "住所" };',
      errors: [{ messageId: "newline" }],
    },
  ],
});
