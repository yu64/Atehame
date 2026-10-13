// Monaco に入っている言語の定義（型が同梱されていないため、使う分だけ宣言する）。
declare module "monaco-editor/languages/definitions/javascript/javascript" {
  import type { languages } from "monaco-editor";

  export const conf: languages.LanguageConfiguration;
  export const language: languages.IMonarchLanguage;
}
