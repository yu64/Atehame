import { createJavaScriptLanguage } from "@src/shared/ui/monaco/javascriptTokens";
import { editorThemes } from "@src/shared/ui/monaco/themes";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import CssWorker from "monaco-editor/language/css/css.worker?worker";
import TypeScriptWorker from "monaco-editor/language/typescript/ts.worker?worker";

export { monaco };

// #############################################################################
// MARK: 型定義

interface NameColors {
  variable: string;
  function: string;
}

// #############################################################################
// MARK: 定数

const lightNameColors: NameColors = {
  variable: "001080",
  function: "795E26",
};

const darkNameColors: NameColors = {
  variable: "9CDCFE",
  function: "DCDCAA",
};

// #############################################################################
// MARK: 内部関数

/** 言語機能のWorkerはViteでバンドルし、CDNから取得しない。 */
function configureWorkers() {
  self.MonacoEnvironment = {
    getWorker(_workerId, label) {
      if (label === "typescript" || label === "javascript") return new TypeScriptWorker();
      if (label === "css") return new CssWorker();
      return new EditorWorker();
    },
  };
}

/**
 * 加工コードは関数本体のため、トップレベルの return を許可する。
 * ブラウザAPIは実行環境（QuickJS）に存在しないため、DOMの型は読み込まない。
 * 言語の版は QuickJS に合わせる（ES2024 の組み込み関数まで使える）。
 */
function configureJavaScript() {
  const javascript = monaco.typescript.javascriptDefaults;
  javascript.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ESNext,
    lib: ["es2024"],
    allowJs: true,
    checkJs: true,
    allowNonTsExtensions: true,
    noEmit: true,
  });
  javascript.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    // 1108: A 'return' statement can only be used within a function body.
    diagnosticCodesToIgnore: [1108],
  });
}

/**
 * JavaScript の字句の定義を、変数・関数・プロパティを色分けするものに置き換える（javascriptTokens.ts）。
 * Monaco の元の定義は読み込みを遅らせて登録されるが、直接登録したものが優先される。
 */
function configureJavaScriptTokens() {
  monaco.languages.setMonarchTokensProvider("javascript", createJavaScriptLanguage());
}

/** 変数・関数・プロパティの色の規則。 */
function nameRules(colors: NameColors): monaco.editor.ITokenThemeRule[] {
  return [
    {
      token: "identifier",
      foreground: colors.variable,
    },
    {
      token: "property",
      foreground: colors.variable,
    },
    {
      token: "function",
      foreground: colors.function,
    },
  ];
}

/**
 * 配色を定義する。変数・関数・プロパティの色は VS Code の既定の配色に合わせる。
 * 名前として読めない文字は不正なトークン（赤字）になるが、構文の誤りは診断の波線で示されるため、通常の文字色にする。
 */
function defineThemes() {
  monaco.editor.defineTheme(editorThemes.light, {
    base: "vs",
    inherit: true,
    rules: [
      {
        token: "invalid",
        foreground: "000000",
      },
      ...nameRules(lightNameColors),
    ],
    colors: {},
  });
  monaco.editor.defineTheme(editorThemes.dark, {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "invalid",
        foreground: "D4D4D4",
      },
      ...nameRules(darkNameColors),
    ],
    colors: {},
  });
}

// #############################################################################
// MARK: 初期化

configureWorkers();
configureJavaScript();
configureJavaScriptTokens();
defineThemes();
