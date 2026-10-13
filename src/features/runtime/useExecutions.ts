import {
  type ExecutionErrorCode,
  JsExecutionEngine,
  JsExecutionError,
  type JsonValue,
  type SourceLocation,
} from "@src/features/runtime/JsExecutionEngine";
import { useEffect, useRef, useState } from "react";

// #############################################################################
// MARK: 型定義

/** 1つの入力の実行結果。 */
export type ExecutionOutcome =
  | { status: "pending" }
  | {
      status: "success";
      output: JsonValue;
      elapsedMs: number;
    }
  | {
      status: "error";
      code: ExecutionErrorCode;
      message: string;
      location?: SourceLocation;
      elapsedMs: number;
    };

export interface Executions {
  /** 入力と同じ順の結果。新しい入力で実行し直している間は、前の結果を残す（数が同じ場合）。 */
  results: ExecutionOutcome[];
  /** 今の入力のうち、実行し終えた数。 */
  done: number;
}

export interface ExecutionsOptions {
  /** コードや入力が変わってから実行するまで待つ時間（ミリ秒）。打ち込みの途中で実行しないため。 */
  debounceMs?: number;
  /** 前置きのコード（JsExecutionEngine の options.prelude）。変わったらエンジンを作り直す。 */
  prelude?: string;
}

interface Request {
  code: string;
  inputs: readonly JsonValue[];
}

// #############################################################################
// MARK: 定数

/** 画面に反映する間隔（ミリ秒）。1件ごとに反映すると、入力が多いときに描画が追いつかない。 */
const flushIntervalMs = 100;

// #############################################################################
// MARK: フック

/**
 * コードを入力ごとに順に実行する（エンジンは1つずつしか実行できない）。
 * コードか入力が変わったら、実行中の1件が終わるのを待ってから、最新の内容で最初からやり直す。
 * エンジンは使い回し、画面を離れたら終了する。
 */
export function useExecutions(
  code: string,
  inputs: readonly JsonValue[],
  options: ExecutionsOptions = {},
): Executions {
  const [state, setState] = useState<Executions>({
    results: [],
    done: 0,
  });
  // 前の結果を引き継ぐため、最新の状態を描画を待たずに読めるようにしておく。
  const stateRef = useRef(state);
  const engineRef = useRef<JsExecutionEngine | null>(null);
  const runningRef = useRef(false);
  const pendingRef = useRef<Request | null>(null);
  const debounceMs = options.debounceMs ?? 0;
  const prelude = options.prelude ?? "";

  // 画面を離れたら Worker を終了する。
  useEffect(() => {
    const engine = new JsExecutionEngine({ prelude });
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      pendingRef.current = null;
      engine.dispose();
    };
  }, [prelude]);

  useEffect(() => {
    const timer = setTimeout(() => {
      pendingRef.current = {
        code,
        inputs,
      };
      void drain();
    }, debounceMs);
    return () => clearTimeout(timer);
    // drain は描画のたびに作り直すが、中身は ref だけを読むので、依存に含めなくてよい。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, inputs, debounceMs, prelude]);

  /** 待っている要求を順に行う。実行中に新しい要求が来たら、今の要求を打ち切って最新を行う。 */
  async function drain() {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      let request: Request | null;
      while ((request = pendingRef.current)) {
        pendingRef.current = null;
        await runRequest(request);
      }
    } finally {
      runningRef.current = false;
    }
  }

  /** 1つの要求の入力を順に実行し、結果を少しずつ反映する。 */
  async function runRequest(request: Request) {
    const engine = engineRef.current;
    if (!engine) return;
    const previous = stateRef.current.results;
    // 数が同じなら前の結果を残して上書きしていく（打ち込みのたびに表示が消えないように）。
    const results: ExecutionOutcome[] = (
      (previous.length === request.inputs.length)
      ? [...previous]
      : request.inputs.map(() => ({ status: "pending" }))
    );
    let done = 0;
    let lastFlush = performance.now();

    /** ここまでの結果を画面に反映する。 */
    function flush() {
      lastFlush = performance.now();
      stateRef.current = {
        results: [...results],
        done,
      };
      setState(stateRef.current);
    }

    flush();

    for (const [index, input] of request.inputs.entries()) {
      const outcome = await execute(engine, request.code, input);
      // 画面を離れたか、新しい要求が来た場合は、この要求の結果は反映しない。
      if (engineRef.current !== engine || pendingRef.current) return;
      results[index] = outcome;
      done = index + 1;
      if (performance.now() - lastFlush >= flushIntervalMs) flush();
    }
    flush();
  }

  return state;
}

// #############################################################################
// MARK: 内部関数

/** 1回実行する。失敗しても例外にせず、エラーの結果にする。 */
async function execute(
  engine: JsExecutionEngine,
  code: string,
  input: JsonValue,
): Promise<ExecutionOutcome> {
  const start = performance.now();
  try {
    const output = await engine.execute(code, input);
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
