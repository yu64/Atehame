import { expose } from "comlink";
import variant from "@jitl/quickjs-singlefile-cjs-release-sync";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import { executeInQuickJS } from "@src/runtime/executeInQuickJS";
import type { WorkerApi } from "@src/runtime/protocol";

// WASMは最初の要求で初期化し、Workerが生きている間は共有する。
type ModulePromise = ReturnType<typeof newQuickJSWASMModuleFromVariant>;
let modulePromise: ModulePromise | undefined;

// WASMの状態が壊れた後は、ホストがWorkerを破棄するまで実行を拒否する。
let broken = false;

const getModule = () => {
  modulePromise ??= newQuickJSWASMModuleFromVariant(variant);
  return modulePromise;
};

// 初期化待ちと加工処理を分け、ホスト側でそれぞれの期限を監視できるようにする。
const api: WorkerApi = {
  async initialize() {
    await getModule();
  },

  async execute(request) {
    if (broken) {
      const message = "実行エンジンを再起動する必要があります。";
      return { type: "error", code: "WORKER_ERROR", message, fatal: true };
    }

    const quickjs = await getModule();
    const result = executeInQuickJS(quickjs, request);
    if (result.type === "error" && result.fatal) broken = true;
    return result;
  },
};

// 公開するのはホスト向けの通信API。QuickJS内には公開しない。
expose(api);
