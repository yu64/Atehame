// @ts-check
import { ternaryRule } from "./ternary.mjs";

/** このプロジェクトだけで使う ESLint のルール。 */
export const atehamePlugin = {
  meta: { name: "atehame" },
  rules: {
    ternary: ternaryRule,
  },
};
