import { limits } from "@src/features/runtime/protocol";
import type {
  ExecutionErrorCode,
  ExecutionRequest,
  ExecutionResult,
  SourceLocation,
} from "@src/features/runtime/protocol";
import type { QuickJSWASMModule, QuickJSHandle, QuickJSContext } from "quickjs-emscripten-core";

// Function('input', body)はQuickJS内で次の形にコンパイルされ、bodyは4行目から始まる。
// (function anonymous(input\n) {\n"use strict";\n<code>\n})
const functionBodyPrefix = '"use strict";\n';
const guestLineOffset = 3;

// ホスト側で検出した失敗。ゲストの例外やWASMの異常と区別する。
class GuestFailure {
  constructor(
    readonly code: ExecutionErrorCode,
    readonly message: string,
  ) {}
}

// ゲスト内でエラーを整形した結果。値はすべてゲスト由来のため、使う前に型を確かめる。
interface FormattedError {
  text: string;
  name: string;
  message: string;
  line: number;
  column: number;
}

export function executeInQuickJS(
  quickjs: QuickJSWASMModule,
  request: ExecutionRequest,
): ExecutionResult {
  const runtime = quickjs.newRuntime();
  runtime.setMemoryLimit(request.memoryLimitBytes);
  runtime.setMaxStackSize(limits.stackBytes);

  // 一度期限に達したら、エラー処理中も割り込み状態を維持する。
  const deadline = performance.now() + request.timeoutMs;
  let interrupted = false;
  runtime.setInterruptHandler(() => {
    interrupted ||= performance.now() >= deadline;
    return interrupted;
  });

  // ホストAPI・通信関数・モジュールローダーは公開しない。
  const vm = runtime.newContext();

  // ゲストの値はハンドルとして保持し、終了時にまとめて解放する。
  const handles: QuickJSHandle[] = [];
  let guestErrorCode: ExecutionErrorCode = "SCRIPT_ERROR";
  let fatal = false;

  function own(handle: QuickJSHandle): QuickJSHandle {
    handles.push(handle);
    return handle;
  }

  function unwrap(result: ReturnType<QuickJSContext["evalCode"]>): QuickJSHandle {
    if (result.error) {
      own(result.error);
      throw result.error;
    }

    return own(result.value);
  }

  // ユーザーコード実行前に組み込み関数をクロージャーへ捕捉する。
  let formatError: QuickJSHandle | undefined;

  try {
    formatError = unwrap(vm.evalCode(guestErrorFormatterSource));
    const run = unwrap(vm.evalCode(guestRunnerSource));
    const serialize = unwrap(vm.evalCode(guestSerializerSource));

    const code = own(vm.newString(functionBodyPrefix + request.code));
    const input = own(vm.newString(request.inputJson));
    const result = unwrap(vm.callFunction(run, vm.undefined, code, input));

    // Promiseは実行待ちにせず拒否する。内部の値も解放対象に含める。
    const promise = vm.getPromiseState(result);
    if (promise.type === "fulfilled" && !promise.notAPromise) {
      own(promise.value);
    }
    if (promise.type === "rejected") own(promise.error);

    const isPromise = promise.type !== "fulfilled" || !promise.notAPromise;
    if (isPromise) {
      throw new GuestFailure("INVALID_OUTPUT", "非同期の加工処理には対応していません。");
    }

    // JSON化とサイズ検査も、同じ実行時間制限の中で行う。
    // ここでの例外はtoJSONや値の検査によるもので、出力の不正として扱う。
    guestErrorCode = "INVALID_OUTPUT";
    const serialized = unwrap(vm.callFunction(serialize, vm.undefined, result));
    if (vm.typeof(serialized) === "undefined") {
      throw new GuestFailure("OUTPUT_LIMIT", "出力サイズの上限を超えました。");
    }

    const outputJson = vm.getString(serialized);
    if (performance.now() >= deadline) return timeoutResult();

    return { type: "result", outputJson };
  } catch (error) {
    // ゲストの例外でもホスト側の判定でもない例外は、WASM内での
    // ネイティブスタック超過や異常終了。QuickJSの状態が壊れている可能性があるため、
    // 解放せずWorkerごと破棄させる。
    if (error instanceof Error) {
      fatal = true;
      const stackExhausted = error instanceof RangeError;
      return {
        type: "error",
        code: stackExhausted ? "STACK_OVERFLOW" : "WORKER_ERROR",
        message: stackExhausted
          ? "再帰が深すぎます。"
          : "実行エンジンで予期しないエラーが発生しました。",
        fatal,
      };
    }

    // 割り込み後はゲストの処理を呼ばず、固定のメッセージを返す。
    if (interrupted) return timeoutResult();

    if (error instanceof GuestFailure) {
      return { type: "error", code: error.code, message: error.message, fatal };
    }

    // 例外の整形中（toStringのgetterなど）に期限を迎えた場合も時間超過とする。
    const result = guestErrorResult(error as QuickJSHandle);
    return interrupted ? timeoutResult() : result;
  } finally {
    // 値を先に解放し、その所有元であるContextとRuntimeを破棄する。
    if (!fatal) {
      for (const handle of handles.reverse()) handle.dispose();
      vm.dispose();
      runtime.dispose();
    }
  }

  function timeoutResult(): ExecutionResult {
    return {
      type: "error",
      code: "TIMEOUT",
      message: "実行時間の上限を超えました。",
      fatal,
    };
  }

  function guestErrorResult(guestError: QuickJSHandle): ExecutionResult {
    const formatted = format(guestError);
    if (!formatted) {
      return {
        type: "error",
        code: guestErrorCode,
        message: "加工処理に失敗しました（構文・実行エラー、またはメモリ上限）。",
        fatal,
      };
    }

    // QuickJSが投げるリソース上限のエラーは専用のコードにする。
    let code = guestErrorCode;
    let message = formatted.text;
    if (formatted.name === "InternalError") {
      if (formatted.message === "out of memory") {
        code = "MEMORY_LIMIT";
        message = "メモリ上限を超えました。";
      } else if (formatted.message === "stack overflow") {
        code = "STACK_OVERFLOW";
        message = "再帰が深すぎます。";
      }
    }

    // ラッパーの行を除き、ユーザーコードでの行番号にする。
    // 末尾で構文が終わっていない場合は閉じ括弧の行を指すため、コードの終端へ丸める。
    let location: SourceLocation | undefined;
    const line = formatted.line - guestLineOffset;
    if (line >= 1 && formatted.column >= 1) {
      const lines = request.code.split("\n");
      location =
        line > lines.length
          ? { line: lines.length, column: lines[lines.length - 1].length + 1 }
          : { line, column: formatted.column };
    }

    return { type: "error", code, message, location, fatal };
  }

  // 捕捉済みの整形関数で例外を文字列化する。整形に失敗した場合はundefined。
  function format(guestError: QuickJSHandle): FormattedError | undefined {
    if (!formatError) return undefined;

    const formatted = vm.callFunction(formatError, vm.undefined, guestError);
    if (formatted.error) {
      own(formatted.error);
      return undefined;
    }

    const value: unknown = JSON.parse(vm.getString(own(formatted.value)));
    const valid =
      typeof value === "object" &&
      value !== null &&
      typeof (value as FormattedError).text === "string" &&
      typeof (value as FormattedError).name === "string" &&
      typeof (value as FormattedError).message === "string" &&
      Number.isInteger((value as FormattedError).line) &&
      Number.isInteger((value as FormattedError).column);
    return valid ? (value as FormattedError) : undefined;
  }
}

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
