import type { ExecutionErrorCode, SourceLocation } from "@src/features/runtime";
import { JsExecutionEngine, JsExecutionError } from "@src/features/runtime";
import type { JsonValue } from "@src/shared/lib/json";
import { useEffect, useRef, useState } from "react";

// #############################################################################
// MARK: 型定義

export type TransformPreview =
  | { status: "idle" }
  | { status: "success"; output: JsonValue; elapsedMs: number }
  | {
      status: "error";
      code: ExecutionErrorCode;
      message: string;
      location?: SourceLocation;
      elapsedMs: number;
    };

interface Request {
  code: string;
  input: JsonValue;
}

// #############################################################################
// MARK: 定数

/** 入力が落ち着いてから加工処理を実行する待ち時間（ミリ秒）。 */
const debounceMs = 300;

// #############################################################################
// MARK: フック

/**
 * コードと入力の変更に追従して加工処理を試行する。
 * エンジンは逐次実行のため、実行中に変更された場合は完了後に最新の内容だけを実行する。
 */
export function useTransformPreview(code: string, input: JsonValue): TransformPreview {
  const [preview, setPreview] = useState<TransformPreview>({ status: "idle" });
  const engineRef = useRef<JsExecutionEngine | null>(null);
  const runningRef = useRef(false);
  const pendingRef = useRef<Request | null>(null);

  // 画面を離れたらWorkerを終了する。
  useEffect(() => {
    const engine = new JsExecutionEngine();
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      pendingRef.current = null;
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      pendingRef.current = {
        code,
        input,
      };
      void drain();
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [code, input]);

  /** 待っている実行を順に行う。実行中に新しい要求が来たら、最後の1つだけを実行する。 */
  async function drain() {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      let request: Request | null;
      while ((request = pendingRef.current)) {
        pendingRef.current = null;
        const engine = engineRef.current;
        if (!engine) return;

        const result = await run(engine, request);
        // 破棄後や、より新しい要求がある場合は表示を更新しない。
        if (engineRef.current === engine && !pendingRef.current) setPreview(result);
      }
    } finally {
      runningRef.current = false;
    }
  }

  return preview;
}

// #############################################################################
// MARK: 内部関数

/** 1回実行し、プレビューの結果にする。 */
async function run(engine: JsExecutionEngine, request: Request): Promise<TransformPreview> {
  const start = performance.now();
  try {
    const output = await engine.execute(request.code, request.input);
    return {
      status: "success",
      output,
      elapsedMs: performance.now() - start,
    };
  } catch (error) {
    const elapsedMs = performance.now() - start;
    if (error instanceof JsExecutionError) {
      return {
        status: "error",
        code: error.code,
        message: error.message,
        location: error.location,
        elapsedMs,
      };
    }
    return {
      status: "error",
      code: "WORKER_ERROR",
      message: String(error),
      elapsedMs,
    };
  }
}
