import { changedRange } from "@src/shared/lib/util/text";
import { Button } from "@src/shared/ui/Button";
import { editorThemes } from "@src/shared/ui/monaco/themes";
import type * as Monaco from "monaco-editor";
import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react";

// #############################################################################
// MARK: 型定義

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
  /** 編集する言語。既定は JavaScript。 */
  language?: "javascript" | "css";
  /** 補完に使う型宣言（.d.ts の内容）。JavaScript のみ。 */
  declarations?: string;
  /** 実行時エラーなど、エディターの外で検出した問題。 */
  markers?: EditorMarker[];
  ariaLabel?: string;
  /** 指定した行へ移動する。key を変えるたびに移動する。 */
  reveal?: { line: number; key: number };
  /** 暗い配色で表示する。 */
  dark?: boolean;
  ref?: Ref<CodeEditorHandle>;
}

type MonacoModule = typeof Monaco;

// #############################################################################
// MARK: 定数

/** エディターの外で検出した問題（markers）の持ち主の名前。 */
const markerOwner = "code-editor";

// #############################################################################
// MARK: コンポーネント

/**
 * Monaco Editor を使ったコードエディター（JavaScript / CSS）。
 * Monaco本体は大きいため、表示時に読み込む。
 */
export function CodeEditor(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<MonacoModule>();
  const [failed, setFailed] = useState(false);
  // 読み込みに失敗した場合に、やり直すたびに増やす。
  const [attempt, setAttempt] = useState(0);
  const dark = props.dark ?? false;

  // 最新のコールバックを、エディター生成時に登録したリスナーから参照する。
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  useImperativeHandle(
    props.ref,
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

    import("@src/shared/ui/monaco/monaco")
      .then(({ monaco: loaded }) => {
        if (disposed || !containerRef.current) return;

        editor = loaded.editor.create(containerRef.current, {
          value: props.value,
          language: props.language ?? "javascript",
          theme: (dark ? editorThemes.dark : editorThemes.light),
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
      .catch(error => {
        console.error("エディターを読み込めませんでした。", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- エディターは読み込み直すときだけ作り直す。
  }, [attempt]);

  // 外部から値が変わった場合だけ、変わった部分をエディターへ反映する。
  // 全体を置き換えないことで、カーソル位置と Monaco の元に戻す履歴を保つ。
  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    const current = model.getValue();
    if (current === props.value) return;

    const { start, oldEnd, newEnd } = changedRange(current, props.value);
    const range = monaco.Range.fromPositions(
      model.getPositionAt(start),
      model.getPositionAt(oldEnd),
    );
    model.pushEditOperations([], [{ range, text: props.value.slice(start, newEnd) }], () => null);
  }, [monaco, props.value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!monaco || !editor || !props.reveal) return;
    const position = { lineNumber: props.reveal.line, column: 1 };
    editor.setPosition(position);
    editor.revealLineInCenter(props.reveal.line);
    editor.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key が変わったときだけ移動する（同じ行へもう一度移動できるように）。
  }, [monaco, props.reveal?.key]);

  useEffect(() => {
    monaco?.editor.setTheme(dark ? editorThemes.dark : editorThemes.light);
  }, [monaco, dark]);

  // 型宣言を登録し、input の補完と型チェックに使う。
  useEffect(() => {
    if (!monaco || props.declarations === undefined || props.language === "css") return;
    const lib = monaco.typescript.javascriptDefaults.addExtraLib(
      props.declarations,
      "ts:code-editor/declarations.d.ts",
    );
    return () => lib.dispose();
  }, [monaco, props.declarations, props.language]);

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
          {(
            failed
            ? (
              <span className="flex flex-col items-center gap-2">
                エディターを読み込めませんでした。
                <Button
                  label="再読み込み"
                  onClick={() => {
                    setFailed(false);
                    setAttempt(value => value + 1);
                  }}
                />
              </span>
            )
            : (
              "エディターを読み込み中…"
            )
          )}
        </div>
      )}
    </div>
  );
}
