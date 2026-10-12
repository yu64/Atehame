import type {
  ExecutionErrorCode,
  ExecutionOptions,
  ExecutionRequest,
  ExecutionResult,
  JsonValue,
  SourceLocation,
  WorkerApi,
} from "@src/features/runtime/protocol";
import { limits } from "@src/features/runtime/protocol";
import type { Remote } from "comlink";
import { releaseProxy, wrap } from "comlink";

export type {
  ExecutionErrorCode,
  ExecutionOptions,
  JsonValue,
  SourceLocation,
} from "@src/features/runtime/protocol";

// #############################################################################
// MARK: 実行エンジン

/** 実行の失敗。code で種類を、location でユーザーコード上の位置を示す。 */
export class JsExecutionError extends Error {
  constructor(
    public readonly code: ExecutionErrorCode,
    message: string,
    /** ユーザーコード上のエラー位置。特定できた場合だけ設定する。 */
    public readonly location?: SourceLocation,
  ) {
    super(message);
    this.name = "JsExecutionError";
  }
}

interface WorkerSession {
  worker: Worker;
  api: Remote<WorkerApi>;
  ready: boolean;
  removeListeners: () => void;
}

/** Workerを再利用し、呼び出しごとに独立したQuickJS環境で逐次実行する。 */
export class JsExecutionEngine {
  private session?: WorkerSession;
  private disposed = false;
  private cancel?: (error: JsExecutionError) => void;

  // ===========================================================================
  // MARK: 実行

  /** 加工のコードを input で実行し、return した値（JSONデータ）を返す。失敗したら JsExecutionError を投げる。 */
  async execute(
    code: string,
    input: JsonValue,
    options: ExecutionOptions = {},
  ): Promise<JsonValue> {
    this.validateExecutionState(options.signal);
    const request = createRequest(code, input, options);
    const cancellation = this.startCancellation(options.signal);
    try {
      const result = await this.send(request, cancellation.cancelled);
      return this.toOutput(result);
    } finally {
      cancellation.release();
    }
  }

  /** 実行中の処理を打ち切り、以後の呼び出しを受け付けなくする。 */
  dispose(): void {
    this.disposed = true;
    this.cancel?.(new JsExecutionError("DISPOSED", "実行エンジンを破棄しました。"));
    this.closeSession();
  }

  /** 実行を受け付けられる状態か確かめる（破棄済み・実行中・キャンセル済みなら例外）。 */
  private validateExecutionState(signal?: AbortSignal): void {
    if (this.disposed) {
      throw new JsExecutionError("DISPOSED", "実行エンジンは破棄されています。");
    }
    if (this.cancel) {
      throw new JsExecutionError("BUSY", "前の実行が完了するまで待ってください。");
    }
    if (signal?.aborted) {
      throw new JsExecutionError("ABORTED", "実行をキャンセルしました。");
    }
  }

  /**
   * 通信の応答とは別に、キャンセルや破棄で待機を打ち切れるようにする。
   * release で、実行中だけ必要なリスナーとキャンセルの状態を解除する。
   */
  private startCancellation(signal: AbortSignal | undefined) {
    const cancelled = new Promise<never>((_, reject) => {
      this.cancel = reject;
    });
    // Worker生成自体が失敗しても、キャンセルの拒否を未処理にしない。
    void cancelled.catch(() => {});

    // 入力のtoJSONなどで、検査中にabortされた場合も拾う。
    const abort = () => {
      this.cancel?.(new JsExecutionError("ABORTED", "実行をキャンセルしました。"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();

    return {
      cancelled,
      release: () => {
        signal?.removeEventListener("abort", abort);
        this.cancel = undefined;
      },
    };
  }

  /** Worker に実行を頼み、結果を待つ。応答を得られなければ Worker を破棄する。 */
  private async send(
    request: ExecutionRequest,
    cancelled: Promise<never>,
  ): Promise<ExecutionResult> {
    let phase: ExecutionErrorCode = "WORKER_ERROR";
    try {
      // 初回だけWorkerとWASMを初期化し、成功後は再利用する。
      const session = this.session ?? this.createSession();
      if (!session.ready) {
        phase = "STARTUP_ERROR";
        await this.waitFor(session.api.initialize(), cancelled, limits.startupTimeoutMs, phase);
        session.ready = true;
      }

      // QuickJSの割り込みとは別に、ホスト側でも応答期限を監視する。
      phase = "WORKER_ERROR";
      const responseTimeoutMs = request.timeoutMs + 100;
      return await this.waitFor<ExecutionResult>(
        session.api.execute(request),
        cancelled,
        responseTimeoutMs,
        "TIMEOUT",
      );
    } catch (error) {
      // 応答を得られなかったWorkerは破棄し、次の実行では作り直す。
      this.closeSession();
      if (error instanceof JsExecutionError) throw error;
      throw new JsExecutionError(phase, "実行エンジンの初期化または通信に失敗しました。");
    }
  }

  /** 結果から出力を取り出す。ゲストの失敗ではWorkerを再利用し、WASMの状態が壊れた場合だけ作り直す。 */
  private toOutput(result: ExecutionResult): JsonValue {
    if (result.type === "error") {
      if (result.fatal) this.closeSession();
      throw new JsExecutionError(result.code, result.message, result.location);
    }
    if (result.outputJson.length > limits.outputLength) {
      throw new JsExecutionError("OUTPUT_LIMIT", "出力サイズの上限を超えました。");
    }
    return JSON.parse(result.outputJson) as JsonValue;
  }

  // ===========================================================================
  // MARK: Worker の管理

  /** Worker を作り、異常があれば待機中の呼び出しに知らせるようにする。 */
  private createSession(): WorkerSession {
    // Vite標準のWorkerバンドルを利用する。Viteが検出できるよう相対パスのリテラルで書く。
    const worker = new Worker(new URL("./quickjs.worker.ts", import.meta.url), { type: "module" });

    // Workerの異常は待機中の呼び出しに通知し、セッションを閉じる。
    const fail = () => {
      const message = "Workerの実行または通信に失敗しました。";
      const error = new JsExecutionError("WORKER_ERROR", message);
      this.cancel?.(error);
      this.closeSession();
    };

    /** Worker の中で起きた例外。ブラウザの既定の報告は止め、失敗として扱う。 */
    function onError(event: ErrorEvent) {
      event.preventDefault();
      fail();
    }
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", fail);

    const session = {
      worker,
      api: wrap<WorkerApi>(worker),
      ready: false,
      removeListeners: () => {
        worker.removeEventListener("error", onError);
        worker.removeEventListener("messageerror", fail);
      },
    };

    this.session = session;
    return session;
  }

  /** 処理を待つ。キャンセルされるか期限を過ぎたら、その時点で例外にする。 */
  private async waitFor<T>(
    operation: Promise<T>,
    cancelled: Promise<never>,
    timeoutMs: number,
    code: ExecutionErrorCode,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      const message = (
        (code === "TIMEOUT")
        ? "実行時間の上限を超えました。"
        : "QuickJSの初期化がタイムアウトしました。"
      );
      timer = setTimeout(() => {
        const error = new JsExecutionError(code, message);
        reject(error);
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, cancelled, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Worker を終了し、次の実行では作り直す。 */
  private closeSession(): void {
    const session = this.session;
    if (!session) return;

    // リスナーとComlinkの参照を解放してからWorkerを終了する。
    this.session = undefined;
    session.removeListeners();
    session.api[releaseProxy]();
    session.worker.terminate();
  }
}

// #############################################################################
// MARK: 入力の確認

/** 制限値を補完・検証し、入力をJSON化したリクエストを返す。 */
function createRequest(
  code: string,
  input: JsonValue,
  options: ExecutionOptions,
): ExecutionRequest {
  const timeoutMs = options.timeoutMs ?? limits.timeoutMs;
  const memoryLimitBytes = options.memoryLimitBytes ?? limits.memoryLimitBytes;
  const invalidCode = typeof code !== "string" || code.length > limits.codeLength;
  const invalidTimeout = (
    !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > limits.maxTimeoutMs
  );
  const invalidMemoryLimit = (
    !Number.isInteger(memoryLimitBytes)
    || memoryLimitBytes < limits.minMemoryLimitBytes
    || memoryLimitBytes > limits.maxMemoryLimitBytes
  );

  if (invalidCode || invalidTimeout || invalidMemoryLimit) {
    const message = "コードの長さ、実行時間、メモリ上限が範囲外です。";
    throw new JsExecutionError("INVALID_INPUT", message);
  }

  return {
    code,
    inputJson: serializeInput(input),
    timeoutMs,
    memoryLimitBytes,
  };
}

/** 入力の型とサイズを検証し、転送用のJSON文字列を返す。 */
function serializeInput(input: JsonValue): string {
  const message = "入力はサイズ上限内のJSONデータにしてください。";
  let inputJson: string | undefined;
  try {
    inputJson = JSON.stringify(input, assertJsonValue);
  } catch {
    throw new JsExecutionError("INVALID_INPUT", message);
  }
  if (typeof inputJson !== "string" || inputJson.length > limits.inputLength) {
    throw new JsExecutionError("INVALID_INPUT", message);
  }
  return inputJson;
}

/**
 * JSON.stringify の replacer。ルートと各プロパティ・配列要素を検査する。
 * toJSONがある場合は、その返り値がここへ渡される。
 */
function assertJsonValue(_key: string, value: unknown): unknown {
  // JSON化で省略・null化される値や、表現できない型を拒否する。
  const valueType = typeof value;
  const unsupportedType = ["undefined", "function", "symbol", "bigint"].includes(valueType);
  const nonFiniteNumber = typeof value === "number" && !Number.isFinite(value);
  if (unsupportedType || nonFiniteNumber) throw new Error("Not JSON data");

  // 配列以外のオブジェクトは、通常のオブジェクトか
  // プロトタイプを持たない辞書だけを許可する。
  const nonArrayObject = value !== null && typeof value === "object" && !Array.isArray(value);
  if (nonArrayObject) {
    const prototype: unknown = Object.getPrototypeOf(value);
    const plainObject = prototype === Object.prototype || prototype === null;
    if (!plainObject) throw new Error("Not JSON data");
  }
  return value;
}
