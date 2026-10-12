import type {
  ExecutionErrorCode,
  ExecutionRequest,
  ExecutionResult,
  SourceLocation,
} from "@src/features/runtime/protocol";
import { limits } from "@src/features/runtime/protocol";
import type { QuickJSContext, QuickJSHandle, QuickJSWASMModule } from "quickjs-emscripten-core";

// #############################################################################
// MARK: 実行

/** 加工のコードを、毎回新しい QuickJS の環境で実行する。 */
export function executeInQuickJS(
  quickjs: QuickJSWASMModule,
  request: ExecutionRequest,
): ExecutionResult {
  return new GuestExecution(quickjs, request).run();
}

// Function('input', body)はQuickJS内で次の形にコンパイルされ、bodyは4行目から始まる。
// (function anonymous(input\n) {\n"use strict";\n<code>\n})
const functionBodyPrefix = '"use strict";\n';
const guestLineOffset = 3;

/**
 * 1回の実行。QuickJS の Runtime・Context と、その中で作った値（ハンドル）を持ち、
 * 終わったらまとめて解放する。
 */
class GuestExecution {
  readonly #request: ExecutionRequest;
  readonly #runtime: ReturnType<QuickJSWASMModule["newRuntime"]>;
  readonly #vm: QuickJSContext;
  readonly #deadline: number;
  /** ゲストの値。終了時にまとめて解放する。 */
  readonly #handles: QuickJSHandle[] = [];
  /** 期限に達したか。一度達したら、エラー処理中も割り込み状態を保つ。 */
  #interrupted = false;
  /** ゲストの例外をどのエラーとして扱うか。結果の検査に入ったら出力の不正にする。 */
  #guestErrorCode: ExecutionErrorCode = "SCRIPT_ERROR";
  /** WASM の状態が壊れたか。壊れたら解放せず、Worker ごと破棄させる。 */
  #fatal = false;
  /** ゲストの例外を整形する関数。ユーザーコードより前に作り、組み込み関数を捕捉しておく。 */
  #formatError?: QuickJSHandle;

  constructor(quickjs: QuickJSWASMModule, request: ExecutionRequest) {
    this.#request = request;
    this.#runtime = quickjs.newRuntime();
    this.#runtime.setMemoryLimit(request.memoryLimitBytes);
    this.#runtime.setMaxStackSize(limits.stackBytes);

    this.#deadline = performance.now() + request.timeoutMs;
    this.#runtime.setInterruptHandler(() => {
      this.#interrupted ||= this.#isPastDeadline();
      return this.#interrupted;
    });

    // ホストAPI・通信関数・モジュールローダーは公開しない。
    this.#vm = this.#runtime.newContext();
  }

  /** 実行して結果を返す。どの場合も、最後に QuickJS の環境を解放する（壊れた場合を除く）。 */
  run(): ExecutionResult {
    try {
      const outputJson = this.#execute();
      return (
        (this.#isPastDeadline())
        ? timeoutResult()
        : {
          type: "result",
          outputJson,
        }
      );
    } catch (error) {
      return this.#errorResult(error);
    } finally {
      this.#dispose();
    }
  }

  // ===========================================================================
  // MARK: 実行の手順

  /** ユーザーコードを実行し、結果を JSON の文字列にして返す。 */
  #execute(): string {
    this.#formatError = this.#evaluate(guestErrorFormatterSource);
    const run = this.#evaluate(guestRunnerSource);
    const serialize = this.#evaluate(guestSerializerSource);

    const code = this.#own(this.#vm.newString(functionBodyPrefix + this.#request.code));
    const input = this.#own(this.#vm.newString(this.#request.inputJson));
    const result = this.#unwrap(this.#vm.callFunction(run, this.#vm.undefined, code, input));
    this.#rejectPromise(result);
    return this.#serialize(serialize, result);
  }

  /** Promise は実行を待たずに拒否する。内部の値も解放の対象に含める。 */
  #rejectPromise(result: QuickJSHandle): void {
    const promise = this.#vm.getPromiseState(result);
    if (promise.type === "fulfilled" && !promise.notAPromise) this.#own(promise.value);
    if (promise.type === "rejected") this.#own(promise.error);

    const isPromise = promise.type !== "fulfilled" || !promise.notAPromise;
    if (isPromise) {
      throw new GuestFailure("INVALID_OUTPUT", "非同期の加工処理には対応していません。");
    }
  }

  /**
   * 結果を JSON にする。JSON 化と大きさの検査も、同じ実行時間の制限の中で行う。
   * ここでの例外は toJSON や値の検査によるもので、出力の不正として扱う。
   */
  #serialize(serialize: QuickJSHandle, result: QuickJSHandle): string {
    this.#guestErrorCode = "INVALID_OUTPUT";
    const serialized = this.#unwrap(this.#vm.callFunction(serialize, this.#vm.undefined, result));
    if (this.#vm.typeof(serialized) === "undefined") {
      throw new GuestFailure("OUTPUT_LIMIT", "出力サイズの上限を超えました。");
    }
    return this.#vm.getString(serialized);
  }

  // ===========================================================================
  // MARK: エラー

  /** 例外を、実行結果のエラーに変換する。 */
  #errorResult(error: unknown): ExecutionResult {
    // ゲストの例外でもホスト側の判定でもない例外は、WASM内でのネイティブスタック超過や異常終了。
    if (!(error instanceof GuestError) && !(error instanceof GuestFailure)) {
      return this.#fatalResult(error);
    }
    // 割り込み後はゲストの処理を呼ばず、固定のメッセージを返す。
    if (this.#interrupted) return timeoutResult();
    if (error instanceof GuestFailure) {
      return {
        type: "error",
        code: error.code,
        message: error.message,
        fatal: false,
      };
    }

    const result = this.#guestErrorResult(error.handle);
    // 例外の整形中（toStringのgetterなど）に期限を迎えた場合も時間超過とする。
    return (this.#interrupted ? timeoutResult() : result);
  }

  /** QuickJS の状態が壊れている可能性があるため、解放せず Worker ごと破棄させる。 */
  #fatalResult(error: unknown): ExecutionResult {
    this.#fatal = true;
    const stackExhausted = error instanceof RangeError;
    return {
      type: "error",
      code: (stackExhausted ? "STACK_OVERFLOW" : "WORKER_ERROR"),
      message: (
        stackExhausted
        ? "再帰が深すぎます。"
        : "実行エンジンで予期しないエラーが発生しました。"
      ),
      fatal: true,
    };
  }

  /** ゲストの例外を整形し、ユーザーコードでの位置を付けたエラーにする。 */
  #guestErrorResult(guestError: QuickJSHandle): ExecutionResult {
    const formatted = this.#format(guestError);
    if (!formatted) {
      return {
        type: "error",
        code: this.#guestErrorCode,
        message: "加工処理に失敗しました（構文・実行エラー、またはメモリ上限）。",
        fatal: false,
      };
    }

    const { code, message } = classifyGuestError(formatted, this.#guestErrorCode);
    const location = userCodeLocation(formatted, this.#request.code);
    return {
      type: "error",
      code,
      message,
      location,
      fatal: false,
    };
  }

  /** 捕捉済みの整形関数で例外を文字列化する。整形に失敗した場合は undefined。 */
  #format(guestError: QuickJSHandle): FormattedError | undefined {
    if (!this.#formatError) return undefined;

    const formatted = this.#vm.callFunction(this.#formatError, this.#vm.undefined, guestError);
    if (formatted.error) {
      this.#own(formatted.error);
      return undefined;
    }
    const value: unknown = JSON.parse(this.#vm.getString(this.#own(formatted.value)));
    return (isFormattedError(value) ? value : undefined);
  }

  // ===========================================================================
  // MARK: ゲストの値

  /** 実行時間の期限を過ぎたか。 */
  #isPastDeadline(): boolean {
    return performance.now() >= this.#deadline;
  }

  /** ゲストの値を、終了時に解放するものとして記録する。 */
  #own(handle: QuickJSHandle): QuickJSHandle {
    this.#handles.push(handle);
    return handle;
  }

  /** ゲストのコードを評価し、結果の値を返す。 */
  #evaluate(source: string): QuickJSHandle {
    return this.#unwrap(this.#vm.evalCode(source));
  }

  /** 結果の値を取り出す。ゲストの例外なら GuestError として投げる。 */
  #unwrap(result: ReturnType<QuickJSContext["evalCode"]>): QuickJSHandle {
    if (result.error) throw new GuestError(this.#own(result.error));
    return this.#own(result.value);
  }

  /** 値を先に解放し、その所有元である Context と Runtime を破棄する。 */
  #dispose(): void {
    if (this.#fatal) return;
    for (const handle of this.#handles.reverse()) handle.dispose();
    this.#vm.dispose();
    this.#runtime.dispose();
  }
}

// #############################################################################
// MARK: エラーの整形

/** ホスト側で検出した失敗。ゲストの例外やWASMの異常と区別する。 */
class GuestFailure {
  constructor(
    readonly code: ExecutionErrorCode,
    readonly message: string,
  ) {}
}

/** ゲストが投げた例外（値はゲストの中にある）。 */
class GuestError {
  constructor(readonly handle: QuickJSHandle) {}
}

/** ゲスト内でエラーを整形した結果。値はすべてゲスト由来のため、使う前に型を確かめる。 */
interface FormattedError {
  text: string;
  name: string;
  message: string;
  line: number;
  column: number;
}

/** ゲスト内で整形したエラーの形をしているか（値はゲスト由来のため信用しない）。 */
function isFormattedError(value: unknown): value is FormattedError {
  return (
    typeof value === "object"
    && value !== null
    && "text" in value
    && typeof value.text === "string"
    && "name" in value
    && typeof value.name === "string"
    && "message" in value
    && typeof value.message === "string"
    && "line" in value
    && Number.isInteger(value.line)
    && "column" in value
    && Number.isInteger(value.column)
  );
}

/** QuickJS が投げるリソース上限のエラーは専用のコードにする。それ以外は fallback のコード。 */
function classifyGuestError(
  formatted: FormattedError,
  fallback: ExecutionErrorCode,
): { code: ExecutionErrorCode; message: string } {
  if (formatted.name === "InternalError") {
    if (formatted.message === "out of memory") {
      return {
        code: "MEMORY_LIMIT",
        message: "メモリ上限を超えました。",
      };
    }
    if (formatted.message === "stack overflow") {
      return {
        code: "STACK_OVERFLOW",
        message: "再帰が深すぎます。",
      };
    }
  }
  return {
    code: fallback,
    message: formatted.text,
  };
}

/**
 * ラッパーの行を除き、ユーザーコードでの位置にする。
 * 末尾で構文が終わっていない場合は閉じ括弧の行を指すため、コードの終端へ丸める。
 */
function userCodeLocation(formatted: FormattedError, code: string): SourceLocation | undefined {
  const line = formatted.line - guestLineOffset;
  if (line < 1 || formatted.column < 1) return undefined;

  const lines = code.split("\n");
  return (
    (line > lines.length)
    ? {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    }
    : {
      line,
      column: formatted.column,
    }
  );
}

/** 実行時間の上限を超えたときの結果。 */
function timeoutResult(): ExecutionResult {
  return {
    type: "error",
    code: "TIMEOUT",
    message: "実行時間の上限を超えました。",
    fatal: false,
  };
}

// #############################################################################
// MARK: ゲストで動かすコード

// ゲストの例外を、長さを制限した文字列とエラー位置へ変換する。
// 例外オブジェクトのgetterが例外を投げても、取れた情報だけで整形する。
const guestErrorFormatterSource = `(() => {
  const string = String;
  const stringify = JSON.stringify;
  const slice = Function.prototype.call.bind(String.prototype.slice);
  const exec = Function.prototype.call.bind(RegExp.prototype.exec);
  const location = /<input>:(\\d+):(\\d+)/;

  const text = value => typeof value === 'string' ? slice(value, 0, 2048) : '';

  return error => {
    const result = { text: '', name: '', message: '', line: 0, column: 0 };
    try {
      result.text = slice(string(error), 0, 2048);
    } catch {}

    const isObject = error !== null && (
      typeof error === 'object' || typeof error === 'function'
    );
    if (isObject) {
      try {
        result.name = text(error.name);
        result.message = text(error.message);

        // スタックの先頭にあるユーザーコードの位置を使う。
        const match = exec(location, text(error.stack));
        if (match) {
          result.line = +match[1];
          result.column = +match[2];
        }
      } catch {}
    }

    return stringify(result);
  };
})()`;

// コードをinput引数付きの同期関数として実行する。
const guestRunnerSource = `(() => {
  const compile = Function;
  const parse = JSON.parse;

  return (functionBody, input) => {
    const transform = compile('input', functionBody);
    const inputValue = parse(input);
    return transform(inputValue);
  };
})()`;

// 結果をゲスト内で検査し、JSONとしてホストへ取り出せる値に限定する。
const guestSerializerSource = `(() => {
  const stringify = JSON.stringify;
  const finite = Number.isFinite;
  const isArray = Array.isArray;
  const getPrototypeOf = Object.getPrototypeOf;
  const objectPrototype = Object.prototype;
  const InvalidOutput = TypeError;

  return value => {
    const json = stringify(value, (_, item) => {
      // toJSONがある場合は、その返り値がここへ渡される。
      // JSON化で省略・null化される値や、表現できない型を拒否する。
      const type = typeof item;
      const unsupportedType = (
        type === 'undefined'
        || type === 'function'
        || type === 'symbol'
        || type === 'bigint'
      );
      const nonFiniteNumber = type === 'number' && !finite(item);
      if (unsupportedType || nonFiniteNumber) {
        throw new InvalidOutput('結果はJSONデータにしてください。');
      }

      // 配列以外のオブジェクトは、通常のオブジェクトか
      // プロトタイプを持たない辞書だけを許可する。
      const nonArrayObject = (
        item !== null
        && type === 'object'
        && !isArray(item)
      );
      if (nonArrayObject) {
        const prototype = getPrototypeOf(item);
        const plainObject = (
          prototype === objectPrototype
          || prototype === null
        );
        if (!plainObject) {
          const message = 'Promiseやクラスのインスタンスは返せません。';
          throw new InvalidOutput(message);
        }
      }

      return item;
    });

    const exceedsOutputLimit = json.length > ${limits.outputLength};
    return exceedsOutputLimit ? undefined : json;
  };
})()`;
