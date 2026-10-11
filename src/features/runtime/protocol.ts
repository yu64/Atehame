import type { JsonValue } from "@src/shared/lib/json";

// 加工処理で受け渡しできる値。
export type { JsonValue } from "@src/shared/lib/json";

// 呼び出し側が失敗の種類を判別するための共通コード。
export type ExecutionErrorCode =
  | "INVALID_INPUT"
  | "BUSY"
  | "DISPOSED"
  | "ABORTED"
  | "STARTUP_ERROR"
  | "WORKER_ERROR"
  | "TIMEOUT"
  | "SCRIPT_ERROR"
  | "MEMORY_LIMIT"
  | "STACK_OVERFLOW"
  | "INVALID_OUTPUT"
  | "OUTPUT_LIMIT";

// ユーザーコード上のエラー位置。どちらも1始まり。
export interface SourceLocation {
  line: number;
  column: number;
}

// 呼び出しごとに指定できる制限とキャンセル通知。
export interface ExecutionOptions {
  timeoutMs?: number;
  memoryLimitBytes?: number;
  signal?: AbortSignal;
}

export const limits = {
  // 実行と初期化の時間制限（ミリ秒）。
  timeoutMs: 1000,
  maxTimeoutMs: 10000,
  startupTimeoutMs: 15000,

  // QuickJSに割り当てるヒープとスタックの制限（バイト）。
  memoryLimitBytes: 16 * 1024 * 1024,
  minMemoryLimitBytes: 1024 * 1024,
  maxMemoryLimitBytes: 64 * 1024 * 1024,
  // WASMの関数呼び出しはWorkerのネイティブスタックも消費する。
  // ChromeのWorkerでは256KiB以上にするとQuickJSより先にブラウザ側があふれるため、
  // 余裕を持たせた値にする（再帰の深さは約700段）。
  stackBytes: 128 * 1024,

  // UTF-16コード単位数。Workerへ転送する前、結果をホストへ取り出す前に制限する。
  codeLength: 64 * 1024,
  inputLength: 1024 * 1024,
  outputLength: 1024 * 1024,
} as const;

// Workerへ渡すデータ。AbortSignalはホスト側で管理する。
export interface ExecutionRequest {
  code: string;
  inputJson: string;
  timeoutMs: number;
  memoryLimitBytes: number;
}

// Comlink越しでもエラーコードを維持するため、例外ではなくデータとして返す。
// fatalはWASMの状態が壊れた可能性を表し、ホストはWorkerを作り直す。
export type ExecutionResult =
  | { type: "result"; outputJson: string }
  | {
      type: "error";
      code: ExecutionErrorCode;
      message: string;
      location?: SourceLocation;
      fatal: boolean;
    };

// Comlinkが公開する、初期化と加工処理の入口。
export interface WorkerApi {
  initialize(): Promise<void>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
