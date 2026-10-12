// @ts-check
import { atehamePlugin } from "./tools/eslint/plugin.mjs";
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import jsdoc from "eslint-plugin-jsdoc";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

// 整形は Prettier に任せ、ESLint はコードの中身と三項演算子の形だけを見る。
// `npm run format` は Prettier の後に ESLint の --fix を行う（三項演算子の形は ESLint が最後に決める）。
export default defineConfig(
  globalIgnores([
    "dist/",
    "temp/",
    "output/",
    "test-results/",
    "playwright-report/",
    "sample.html",
    ".claude/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,mjs,js}"],
    plugins: {
      atehame: atehamePlugin,
      jsdoc,
      // React Compiler 向けの規則（描画中の ref の読み書きの禁止など）は入れず、基本の2つだけ使う。
      "react-hooks": reactHooks,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "atehame/ternary": "error",

      // 関数・クラス・メソッドには、公開していないものも JSDoc を付ける。
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: false,
          checkConstructors: false,
          // 自動では空の JSDoc しか書けないため、直さずに知らせるだけにする。
          enableFixer: false,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            MethodDefinition: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          // クラスのフィールドに書いた関数（designerStore の操作など）。
          contexts: ["PropertyDefinition > ArrowFunctionExpression"],
        },
      ],
      "jsdoc/no-blank-blocks": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // import は読み込み先の順に並べ、まとまりには分けない。
      "simple-import-sort/imports": ["error", { groups: [["^"]] }],
      "simple-import-sort/exports": "error",

      // 名前のある関数は function で書く（インラインのアロー関数は可）。
      "func-style": ["error", "declaration"],
      eqeqeq: ["error", "always"],
      // 1行に収まる if だけ {} を省ける。
      curly: ["error", "multi-line"],
      "no-console": ["error", { allow: ["warn", "error"] }],

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

      // export は名前付きにそろえる。
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "export は名前付きにします（default export は使いません）。",
        },
        {
          selector: "ExportSpecifier[exported.name='default']",
          message: "export は名前付きにします（default export は使いません）。",
        },
      ],
    },
  },
  {
    // Node.js で動かすスクリプト（Playwright でブラウザも操作する）。
    files: ["test/**/*.mjs", "tools/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { "no-console": "off" },
  },
  {
    // フレームワークや道具が default export を求めるファイル。
    files: ["src/pages/**/+*.{ts,tsx}", "*.config.{ts,mjs,js}", "eslint.config.mjs"],
    rules: { "no-restricted-syntax": "off" },
  },
);
