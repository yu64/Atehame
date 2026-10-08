import CodeEditor, { type CodeEditorHandle, type EditorMarker } from "@src/components/CodeEditor";
import { Input } from "@src/components/Input";
import MainContent from "@src/components/MainContent";
import StepHeader from "@src/components/StepHeader";
import useSampleOutput from "@src/hooks/useSampleOutput";
import type { TransformPreview } from "@src/hooks/useTransformPreview";
import { fieldTypeLabels } from "@src/models/DataSchema";
import { createInputDeclaration } from "@src/models/TransformInput";
import type { ExecutionErrorCode } from "@src/runtime/JsExecutionEngine";
import { schemaAtom } from "@src/store/schema";
import { sampleRowAtom, transformCodeAtom } from "@src/store/transform";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import { navigate } from "vike/client/router";

const errorLabels: Record<ExecutionErrorCode, string> = {
  SCRIPT_ERROR: "エラー",
  MEMORY_LIMIT: "メモリ上限",
  STACK_OVERFLOW: "再帰の上限",
  TIMEOUT: "時間切れ",
  INVALID_OUTPUT: "出力が不正",
  OUTPUT_LIMIT: "出力が大きすぎます",
  INVALID_INPUT: "入力が不正",
  BUSY: "実行中",
  ABORTED: "中断",
  DISPOSED: "終了済み",
  STARTUP_ERROR: "起動エラー",
  WORKER_ERROR: "エンジンエラー",
};

export default function Page() {
  const schema = useAtomValue(schemaAtom);
  const [code, setCode] = useAtom(transformCodeAtom);
  const [sampleRow, setSampleRow] = useAtom(sampleRowAtom);
  const editorRef = useRef<CodeEditorHandle>(null);

  const declarations = useMemo(() => createInputDeclaration(schema), [schema]);
  const { conversion, preview } = useSampleOutput();

  const markers = useMemo<EditorMarker[]>(() => {
    if (preview.status !== "error" || !preview.location) return [];
    return [{ ...preview.location, message: preview.message }];
  }, [preview]);

  return (
    <>
      <StepHeader
        title="加工"
        description={
          <>
            CSVの1行を <code className="font-mono">input</code> として受け取り、レイアウトに渡す値を{" "}
            <code className="font-mono">return</code> します。
          </>
        }
        onBack={() => navigate("/edit/schema")}
        onNext={() => navigate("/edit/layout")}
      />
      <MainContent mode="canvas">
        <div
          className={`
          h-full min-h-0
          grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]
          overflow-auto lg:overflow-hidden
        `}
        >
          <section
            aria-label="加工コード"
            className="h-[60vh] lg:h-full min-h-0 min-w-0 bg-surface"
          >
            <CodeEditor
              ref={editorRef}
              value={code}
              onChange={setCode}
              declarations={declarations}
              markers={markers}
              ariaLabel="加工コード"
            />
          </section>

          <aside
            className={`
            flex flex-col gap-6 min-w-0
            px-4 py-4
            border-t lg:border-t-0 lg:border-l border-surface-border
            lg:overflow-auto
          `}
          >
            <section className="flex flex-col gap-3">
              <h2 className="font-bold text-text-primary">サンプル入力</h2>
              {schema.fields.length === 0 ? (
                <div className="flex flex-col items-start gap-2 text-sm text-text-secondary">
                  <p>カラムが定義されていません。先にスキーマでカラムを追加してください。</p>
                  <button
                    type="button"
                    className="atehame-btn-secondary btn-sm"
                    onClick={() => navigate("/edit/schema")}
                  >
                    スキーマへ
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {schema.fields.map(field => {
                    const problem = conversion.problems.find(p => p.fieldId === field.id);
                    return (
                      <Input
                        key={field.id}
                        type="text"
                        label={field.name === "" ? "（名前なし）" : field.name}
                        description={`${fieldTypeLabels[field.type].name}${field.memo ? `・${field.memo}` : ""}`}
                        error={problem?.message}
                        value={sampleRow[field.id] ?? ""}
                        onChange={event => {
                          const text = event.currentTarget.value;
                          setSampleRow(current => ({ ...current, [field.id]: text }));
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold text-text-primary">出力</h2>
                <PreviewStatus preview={preview} />
              </div>
              <PreviewBody
                preview={preview}
                onReveal={(line, column) => editorRef.current?.revealPosition(line, column)}
              />
            </section>
          </aside>
        </div>
      </MainContent>
    </>
  );
}

interface PreviewStatusProps {
  preview: TransformPreview;
}

function PreviewStatus(props: PreviewStatusProps) {
  const preview = props.preview;
  if (preview.status === "idle") {
    return <span className="text-sm text-text-tertiary">実行待ち</span>;
  }

  const elapsed = `${preview.elapsedMs.toFixed(1)} ms`;
  if (preview.status === "success") {
    return (
      <span className="badge badge-sm border-none bg-status-success-bg text-status-success">
        成功・{elapsed}
      </span>
    );
  }
  return (
    <span className="badge badge-sm border-none bg-status-error-bg text-status-error">
      {errorLabels[preview.code]}・{elapsed}
    </span>
  );
}

interface PreviewBodyProps {
  preview: TransformPreview;
  /** エラー位置へエディターを移動する。 */
  onReveal: (line: number, column: number) => void;
}

function PreviewBody(props: PreviewBodyProps) {
  const preview = props.preview;

  if (preview.status === "error") {
    return (
      <div
        role="alert"
        className={`
          flex flex-col items-start gap-2
          p-3 rounded-lg
          bg-status-error-bg text-status-error
          border border-status-error/30
        `}
      >
        <p className="text-sm font-mono whitespace-pre-wrap break-all">{preview.message}</p>
        {preview.location && (
          <button
            type="button"
            className="atehame-btn-secondary btn-sm"
            onClick={() => props.onReveal(preview.location!.line, preview.location!.column)}
          >
            {preview.location.line}行目 {preview.location.column}列へ移動
          </button>
        )}
      </div>
    );
  }

  return (
    <pre
      className={`
      m-0 p-3 rounded-lg
      bg-surface border border-surface-border
      text-sm font-mono text-text-primary
      whitespace-pre-wrap break-all
      overflow-auto
    `}
    >
      {preview.status === "success" ? JSON.stringify(preview.output, null, 2) : "…"}
    </pre>
  );
}
