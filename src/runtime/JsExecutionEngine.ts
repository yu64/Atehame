import { wrap, releaseProxy } from "comlink";
import type { Remote } from "comlink";
import { limits } from "@src/runtime/protocol";
import type {
  ExecutionErrorCode,
  ExecutionOptions,
  ExecutionRequest,
  ExecutionResult,
  JsonValue,
  SourceLocation,
  WorkerApi,
} from "@src/runtime/protocol";

export type {
  ExecutionErrorCode,
  ExecutionOptions,
  JsonValue,
  SourceLocation,
} from "@src/runtime/protocol";

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

  async execute(
    code: string,
    input: JsonValue,
    options: ExecutionOptions = {},
  ): Promise<JsonValue> {
    this.validateExecutionState(options.signal);
    const request = this.createValidatedRequest(code, input, options);

    // 通信の応答とは別に、キャンセルや破棄で待機を打ち切れるようにする。
    const cancelled = new Promise<never>((_, reject) => {
      this.cancel = reject;
    });

    // Worker生成自体が失敗しても、キャンセルの拒否を未処理にしない。
    void cancelled.catch(() => {});

    // 入力のtoJSONなどで、検査中にabortされた場合も拾う。
    const abort = () => {
      const error = new JsExecutionError("ABORTED", "実行をキャンセルしました。");
      this.cancel?.(error);
    };
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();

    let phase: ExecutionErrorCode = "WORKER_ERROR";
    let result: ExecutionResult;

    try {
      // 初回だけWorkerとWASMを初期化し、成功後は再利用する。
      const session = this.session ?? this.createSession();
      if (!session.ready) {
        phase = "STARTUP_ERROR";
        const initialization = session.api.initialize();
        await this.waitFor(initialization, cancelled, limits.startupTimeoutMs, phase);
        session.ready = true;
      }

      // QuickJSの割り込みとは別に、ホスト側でも応答期限を監視する。
      phase = "WORKER_ERROR";
      const execution = session.api.execute(request);
      const responseTimeoutMs = request.timeoutMs + 100;
      result = await this.waitFor<ExecutionResult>(
        execution,
        cancelled,
        responseTimeoutMs,
        "TIMEOUT",
      );
    } catch (error) {
      // 応答を得られなかったWorkerは破棄し、次の実行では作り直す。
      this.closeSession();
      if (error instanceof JsExecutionError) throw error;
      throw new JsExecutionError(phase, "実行エンジンの初期化または通信に失敗しました。");
    } finally {
      // 実行中だけ必要なリスナーとキャンセル状態を解除する。
      options.signal?.removeEventListener("abort", abort);
      this.cancel = undefined;
    }

    // ゲストの失敗ではWorkerを再利用する。WASMの状態が壊れた場合だけ作り直す。
    if (result.type === "error") {
      if (result.fatal) this.closeSession();
      throw new JsExecutionError(result.code, result.message, result.location);
    }
    if (result.outputJson.length > limits.outputLength) {
      throw new JsExecutionError("OUTPUT_LIMIT", "出力サイズの上限を超えました。");
    }

    return JSON.parse(result.outputJson) as JsonValue;
  }

  /** 実行中の処理を打ち切り、以後の呼び出しを受け付けなくする。 */
  dispose(): void {
    this.disposed = true;
    this.cancel?.(new JsExecutionError("DISPOSED", "実行エンジンを破棄しました。"));
    this.closeSession();
  }

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

  /** 制限値を補完・検証し、入力をJSON化したリクエストを返す。 */
  private createValidatedRequest(
    code: string,
    input: JsonValue,
    options: ExecutionOptions,
  ): ExecutionRequest {
    const timeoutMs = options.timeoutMs ?? limits.timeoutMs;
    const memoryLimitBytes = options.memoryLimitBytes ?? limits.memoryLimitBytes;
    const invalidCode = typeof code !== "string" || code.length > limits.codeLength;
    const invalidTimeout =
      !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > limits.maxTimeoutMs;
    const invalidMemoryLimit =
      !Number.isInteger(memoryLimitBytes) ||
      memoryLimitBytes < limits.minMemoryLimitBytes ||
      memoryLimitBytes > limits.maxMemoryLimitBytes;

    if (invalidCode || invalidTimeout || invalidMemoryLimit) {
      const message = "コードの長さ、実行時間、メモリ上限が範囲外です。";
      throw new JsExecutionError("INVALID_INPUT", message);
    }

    const inputJson = this.serializeInput(input);
    return { code, inputJson, timeoutMs, memoryLimitBytes };
  }

  /** 入力の型とサイズを検証し、転送用のJSON文字列を返す。 */
  private serializeInput(input: JsonValue): string {
    let inputJson: string;
    try {
      inputJson = JSON.stringify(input, (_, value) => {
        // ルートと各プロパティ・配列要素を検査する。
        // toJSONがある場合は、その返り値がここへ渡される。
        // JSON化で省略・null化される値や、表現できない型を拒否する。
        const valueType = typeof value;
        const unsupportedType = ["undefined", "function", "symbol", "bigint"].includes(valueType);
        const nonFiniteNumber = valueType === "number" && !Number.isFinite(value);

        if (unsupportedType || nonFiniteNumber) {
          throw new Error("Not JSON data");
        }

        // 配列以外のオブジェクトは、通常のオブジェクトか
        // プロトタイプを持たない辞書だけを許可する。
        const nonArrayObject = value !== null && valueType === "object" && !Array.isArray(value);
        if (nonArrayObject) {
          const prototype = Object.getPrototypeOf(value);
          const plainObject = prototype === Object.prototype || prototype === null;
          if (!plainObject) throw new Error("Not JSON data");
        }

        return value;
      });

      const invalidInputJson =
        typeof inputJson !== "string" || inputJson.length > limits.inputLength;
      if (invalidInputJson) {
        throw new Error("Input too large");
      }
    } catch {
      const message = "入力はサイズ上限内のJSONデータにしてください。";
      throw new JsExecutionError("INVALID_INPUT", message);
    }

    return inputJson;
  }

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

    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      fail();
    };
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

  private async waitFor<T>(
    operation: Promise<T>,
    cancelled: Promise<never>,
    timeoutMs: number,
    code: ExecutionErrorCode,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      const message =
        code === "TIMEOUT"
          ? "実行時間の上限を超えました。"
          : "QuickJSの初期化がタイムアウトしました。";
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
