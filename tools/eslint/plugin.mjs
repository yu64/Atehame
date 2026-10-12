// @ts-check
import { objectNewlineRule } from "./objectNewline.mjs";
import { parenBlockRule } from "./parenBlock.mjs";
import { ternaryRule } from "./ternary.mjs";

// #############################################################################
// MARK: 定数

/** このプロジェクトだけで使う ESLint のルール。 */
export const atehamePlugin = {
  meta: { name: "atehame" },
  rules: {
    ternary: ternaryRule,
    "paren-block": parenBlockRule,
    "object-newline": objectNewlineRule,
  },
};
