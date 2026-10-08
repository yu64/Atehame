import { isDarkAtom } from "@src/store/atom";
import { useAtomValue } from "jotai";
import type * as Monaco from "monaco-editor";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface EditorMarker {
  /** 1始まりの行・列。 */
  line: number;
  column: number;
  message: string;
}

export interface CodeEditorHandle {
  /** 指定位置へカーソルを移動し、見える位置までスクロールする。 */
  revealPosition: (line: number, column: number) => void;
}

export interface Props {
  value: string;
  onChange: (value: string) => void;
  /** 補完に使う型宣言（.d.ts の内容）。 */
  declarations?: string;
  /** 実行時エラーなど、エディターの外で検出した問題。 */
  markers?: EditorMarker[];
  ariaLabel?: string;
}

type MonacoModule = typeof Monaco;

const markerOwner = "atehame";

/**
 * Monaco Editor を使ったJavaScriptエディター。
 * Monaco本体は大きいため、表示時に読み込む。
 */
export const CodeEditor = forwardRef<CodeEditorHandle, Props>(function CodeEditor(
  props: Props,
  ref: React.ForwardedRef<CodeEditorHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<MonacoModule | null>(null);
  const [failed, setFailed] = useState(false);
  const dark = useAtomValue(isDarkAtom);

  // 最新のコールバックを、エディター生成時に登録したリスナーから参照する。
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  useImperativeHandle(
    ref,
    () => ({
      revealPosition(line, column) {
        const editor = editorRef.current;
        if (!editor) return;
        editor.setPosition({ lineNumber: line, column });
        editor.revealPositionInCenterIfOutsideViewport({ lineNumber: line, column });
        editor.focus();
      },
    }),
    [],
  );

  // Monacoを読み込み、エディターを生成する。
  useEffect(() => {
    let disposed = false;
    let editor: Monaco.editor.IStandaloneCodeEditor | undefined;

    import("@src/components/monaco/monaco")
      .then(({ default: loaded }) => {
        if (disposed || !containerRef.current) return;

        editor = loaded.editor.create(containerRef.current, {
          value: props.value,
          language: "javascript",
          theme: dark ? "atehame-dark" : "atehame-light",
          automaticLayout: true,
          minimap: { enabled: false },
          fontFamily: "'Fira Code', monospace",
          fontSize: 14,
          tabSize: 2,
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
          ariaLabel: props.ariaLabel,
        });
        editor.onDidChangeModelContent(() => {
          onChangeRef.current(editor!.getValue());
        });

        editorRef.current = editor;
        setMonaco(loaded);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      editorRef.current = null;
      // エディターから外してからモデルを破棄する。逆順ではMonaco内部でエラーになる。
      const model = editor?.getModel();
      editor?.dispose();
      model?.dispose();
    };
    // 初期値と初期テーマは生成時だけ使い、以降の変更は個別のeffectで反映する。
  }, []);

  // 外部から値が変わった場合だけエディターへ反映する（入力中のカーソルを保つ）。
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== props.value) {
      editor.setValue(props.value);
    }
  }, [monaco, props.value]);

  useEffect(() => {
    monaco?.editor.setTheme(dark ? "atehame-dark" : "atehame-light");
  }, [monaco, dark]);

  // 型宣言を登録し、input の補完と型チェックに使う。
  useEffect(() => {
    if (!monaco || props.declarations === undefined) return;
    const lib = monaco.typescript.javascriptDefaults.addExtraLib(
      props.declarations,
      "ts:atehame/input.d.ts",
    );
    return () => lib.dispose();
  }, [monaco, props.declarations]);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;

    const markers = (props.markers ?? []).map(marker => ({
      severity: monaco.MarkerSeverity.Error,
      message: marker.message,
      startLineNumber: marker.line,
      startColumn: marker.column,
      endLineNumber: marker.line,
      endColumn: model.getLineMaxColumn(Math.min(marker.line, model.getLineCount())),
    }));
    monaco.editor.setModelMarkers(model, markerOwner, markers);
  }, [monaco, props.markers]);

  return (
    <div className="relative size-full min-h-0 min-w-0">
      <div ref={containerRef} className="size-full" />
      {!monaco && (
        <div
          className={`
            absolute inset-0
            flex items-center justify-center
            text-sm text-text-secondary
          `}
        >
          {failed ? "エディターを読み込めませんでした。" : "エディターを読み込み中…"}
        </div>
      )}
    </div>
  );
});

export default CodeEditor;
