import type { languages } from "monaco-editor";
import { language as baseLanguage } from "monaco-editor/languages/definitions/javascript/javascript";

// #############################################################################
// MARK: 定数

/**
 * 名前の先頭に使える文字。半角英字に加えて、日本語の名前（`input.住所` など）も名前として扱う。
 * ラテン文字の拡張・かな・漢字・全角英数字・半角カナ。
 */
const nameStart = (
  "a-zA-Z_$\\u00c0-\\u024f\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff"
  + "\\uff10-\\uff19\\uff21-\\uff3a\\uff41-\\uff5a\\uff66-\\uff9f"
);

/** 名前（変数・関数・プロパティ）。 */
const name = `[${nameStart}][${nameStart}0-9]*`;

/** 直後に `(` が続く（関数の呼び出し）。 */
const beforeCall = "(?=\\s*\\()";

/** Monaco の元の定義で、名前とキーワードを読む規則（これを置き換える）。 */
const baseIdentifierSource = "#?[a-z_$][\\w$]*";

// #############################################################################
// MARK: 関数

/**
 * 変数・関数・プロパティを色分けする JavaScript の字句の定義。
 * 型の情報は使わず、書き方で見分ける: 直後に `(` があれば関数、`.` の後ならプロパティ、それ以外は変数。
 * そのため `const f = atehame.toJpEra;` のように `(` なしで使う関数は、関数の色にならない。
 */
export function createJavaScriptLanguage(): languages.IMonarchLanguage {
  const common = baseLanguage.tokenizer.common.filter(
    rule =>
      !(
        Array.isArray(rule)
        && rule[0] instanceof RegExp
        && rule[0].source === baseIdentifierSource
      ),
  );

  return {
    ...baseLanguage,
    tokenizer: {
      ...baseLanguage.tokenizer,
      common: [
        // `...input` の `.` をプロパティの前の `.` と取り違えないよう、先に読む。
        [/\.\.\./, "delimiter"],
        [new RegExp(`(\\.)(${name})${beforeCall}`), ["delimiter", "function"]],
        [new RegExp(`(\\.)(${name})`), ["delimiter", "property"]],
        [new RegExp(`#?${name}${beforeCall}`), keywordOr("function")],
        [/[A-Z][\w$]*/, "type.identifier"],
        [new RegExp(`#?${name}`), keywordOr("identifier")],
        ...common,
      ],
    },
  };
}

// #############################################################################
// MARK: 内部関数

/** キーワードならキーワード、それ以外は token として色分けする動作。 */
function keywordOr(token: string): languages.IMonarchLanguageAction {
  return {
    cases: {
      "@keywords": "keyword",
      "@default": token,
    },
  };
}
