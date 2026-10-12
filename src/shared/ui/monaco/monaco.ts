import { editorThemes } from "@src/shared/ui/monaco/themes";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import CssWorker from "monaco-editor/language/css/css.worker?worker";
import TypeScriptWorker from "monaco-editor/language/typescript/ts.worker?worker";

export { monaco };

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
 */
function configureJavaScript() {
  const javascript = monaco.typescript.javascriptDefaults;
  javascript.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ES2020,
    lib: ["es2020"],
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
 * JavaScriptの色分けはASCII以外の識別子を不正なトークン（赤字）とする。
 * 日本語の識別子も使えるよう、通常の文字色で表示する。構文の誤りは診断の波線で示される。
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
    ],
    colors: {},
  });
}

// #############################################################################
// MARK: 初期化

configureWorkers();
configureJavaScript();
defineThemes();
