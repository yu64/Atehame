// @ts-check
import { ternaryRule } from "./ternary.mjs";

// #############################################################################
// MARK: 定数

/** このプロジェクトだけで使う ESLint のルール。 */
export const atehamePlugin = {
  meta: { name: "atehame" },
  rules: {
    ternary: ternaryRule,
  },
};
