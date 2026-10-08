import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build, createServer, preview } from "vite";
import { chromium } from "playwright";

// アプリ画面と独立した入口で、本番バンドルにWorker/WASMが含まれることも検証する。
const root = fileURLToPath(new URL("./", import.meta.url));
const outDir = fileURLToPath(new URL("../../temp/runtime-test-dist/", import.meta.url));
const config = {
  configFile: false,
  root,
  base: "/runtime-test/",
  resolve: {
    alias: { "@src": fileURLToPath(new URL("../../src", import.meta.url)) },
  },
  worker: { format: "es" },
  optimizeDeps: {
    include: ["comlink", "@jitl/quickjs-singlefile-cjs-release-sync", "quickjs-emscripten-core"],
  },
  build: { outDir, emptyOutDir: true },
};
await build(config);
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function check(url, mode) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  try {
    await page.goto(url);
    await page.waitForFunction(() => Boolean(window.JsExecutionEngine));
    const results = await page.evaluate(async () => {
      const engine = new window.JsExecutionEngine();
      const results = [];
      const record = (name, passed) => {
        if (!passed) throw new Error(`FAIL: ${name}`);
        results.push(name);
      };
      async function rejects(name, code, input, expected, options, target = engine) {
        try {
          await target.execute(code, input, options);
          throw new Error(`Unexpected success: ${name}`);
        } catch (error) {
          record(`${name} (${error.code})`, error.code === expected);
          return error;
        }
      }
      try {
        const input = { name: "山田", suffix: "様", count: 2 };
        const value = await engine.execute(
          "return { address: input.name + input.suffix, count: input.count * 2 };",
          input,
        );
        record("JSON transform", value.address === "山田様" && value.count === 4);
        await engine.execute(
          "input.count = 99; globalThis.leaked = 1; Object.prototype.leaked = 1; return null;",
          input,
        );
        record("input copy", input.count === 2);
        record(
          "fresh context",
          (await engine.execute("return typeof globalThis.leaked + typeof ({}).leaked;", null)) ===
            "undefinedundefined",
        );
        const globals = await engine.execute(
          "return [typeof window, typeof document, typeof fetch, typeof XMLHttpRequest, typeof localStorage, typeof indexedDB, typeof postMessage, typeof Worker, typeof process];",
          null,
        );
        record(
          "no browser/Node capabilities",
          globals.every(value => value === "undefined"),
        );
        record(
          "constructor stays in guest",
          (await engine.execute(
            'return ({}).constructor.constructor("return typeof fetch")();',
            null,
          )) === "undefined",
        );
        record("primitive JSON", (await engine.execute("return input;", false)) === false);
        record(
          "captured serializer",
          (await engine.execute('JSON.stringify = () => "null"; return { intact: true };', null))
            .intact === true,
        );
        await rejects("syntax", "return {;", null, "SCRIPT_ERROR");
        await rejects("exception", 'throw new Error("test");', null, "SCRIPT_ERROR");
        await rejects(
          "network access",
          'return fetch("https://example.com");',
          null,
          "SCRIPT_ERROR",
        );
        await rejects(
          "module loading",
          'return import("https://example.com/module.js");',
          null,
          "INVALID_OUTPUT",
        );
        await rejects("undefined", "return undefined;", null, "INVALID_OUTPUT");
        await rejects("NaN", "return NaN;", null, "INVALID_OUTPUT");
        await rejects("BigInt", "return 1n;", null, "INVALID_OUTPUT");
        await rejects("cycle", "const a = {}; a.self = a; return a;", null, "INVALID_OUTPUT");
        await rejects("Promise", "return Promise.resolve(1);", null, "INVALID_OUTPUT");
        await rejects(
          "nested Promise",
          "return { x: Promise.resolve(1) };",
          null,
          "INVALID_OUTPUT",
        );
        await rejects("oversized output", 'return "a".repeat(1024 * 1024);', null, "OUTPUT_LIMIT");
        await rejects("infinite loop", "while (true) {}", null, "TIMEOUT", { timeoutMs: 30 });
        await rejects(
          "serialization loop",
          "return { toJSON() { while (true) {} } };",
          null,
          "TIMEOUT",
          { timeoutMs: 30 },
        );
        await rejects(
          "hostile error",
          "throw { toString() { while (true) {} } };",
          null,
          "TIMEOUT",
          { timeoutMs: 30 },
        );
        await rejects(
          "memory limit",
          'const a = []; for (let i = 0; i < 100000; i++) a.push("x".repeat(1024)); return a.length;',
          null,
          "MEMORY_LIMIT",
          { memoryLimitBytes: 1024 * 1024 },
        );
        await rejects(
          "infinite recursion",
          "function f(n) { return f(n + 1) + 1; } return f(0);",
          null,
          "STACK_OVERFLOW",
        );
        record(
          "bounded recursion",
          (await engine.execute(
            "function f(n) { return n ? f(n - 1) + 1 : 0; } return f(500);",
            null,
          )) === 500,
        );
        const runtimeError = await rejects(
          "runtime error location",
          "const a = 1;\nconst b = null;\n  return b.x;",
          null,
          "SCRIPT_ERROR",
        );
        record(
          "runtime error line",
          runtimeError.location?.line === 3 && runtimeError.location?.column === 11,
        );
        const syntaxError = await rejects(
          "syntax error location",
          "const a = 1;\nreturn {;",
          null,
          "SCRIPT_ERROR",
        );
        record("syntax error line", syntaxError.location?.line === 2);
        const unterminated = await rejects(
          "unterminated code",
          "const a = 1;\nreturn { a: input.",
          null,
          "SCRIPT_ERROR",
        );
        record(
          "unterminated code points to end",
          unterminated.location?.line === 2 && unterminated.location?.column === 19,
        );
        const thrown = await rejects("non-Error throw", 'throw "plain";', null, "SCRIPT_ERROR");
        record("non-Error message", thrown.message === "plain" && thrown.location === undefined);
        record("recovery after failures", (await engine.execute("return 42;", null)) === 42);
        await rejects("invalid limit", "return 1;", null, "INVALID_INPUT", { timeoutMs: NaN });
        await rejects("oversized source", " ".repeat(65537), null, "INVALID_INPUT");
        await rejects("oversized input", "return 1;", "x".repeat(1024 * 1024), "INVALID_INPUT");
        await rejects("non-JSON input", "return 1;", { x: undefined }, "INVALID_INPUT");
        const controller = new AbortController();
        const pending = engine.execute("while (true) {}", null, { signal: controller.signal });
        const cancelled = pending.catch(error => error.code);
        await rejects("concurrent execution", "return 1;", null, "BUSY");
        controller.abort();
        record("cancellation", (await cancelled) === "ABORTED");
        await rejects("already aborted", "return 1;", null, "ABORTED", {
          signal: controller.signal,
        });
        record("recovery after cancellation", (await engine.execute("return 7;", null)) === 7);
        const disposed = engine.execute("while (true) {}", null).catch(error => error.code);
        engine.dispose();
        record("dispose while running", (await disposed) === "DISPOSED");
        await rejects("execute after disposal", "return 1;", null, "DISPOSED");
      } finally {
        engine.dispose();
      }

      const cold = new window.JsExecutionEngine();
      const controller = new AbortController();
      try {
        const pending = cold
          .execute("return 1;", null, { signal: controller.signal })
          .catch(error => error.code);
        controller.abort();
        record("cancel during initialization", (await pending) === "ABORTED");
        record(
          "reinitialize after cold cancellation",
          (await cold.execute("return 2;", null)) === 2,
        );
      } finally {
        cold.dispose();
      }

      // 通信を故障させ、QuickJSの割り込みに依存しないホスト側の終了処理も確認する。
      const NativeWorker = window.Worker;
      let latestWorker;
      let created = 0;
      let stopped = 0;
      let dropExecution = false;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args);
          created++;
          latestWorker = this;
        }
        postMessage(message, ...args) {
          if (dropExecution && message.type === "APPLY" && message.path[0] === "execute") {
            return;
          }
          super.postMessage(message, ...args);
        }
        terminate() {
          stopped++;
          super.terminate();
        }
      };
      const faulted = new window.JsExecutionEngine();
      try {
        await faulted.execute("return 1;", null);

        // ゲスト側の失敗ではWASMを読み直さず、同じWorkerを使い続ける。
        await rejects(
          "reuse: script error",
          'throw new Error("x");',
          null,
          "SCRIPT_ERROR",
          undefined,
          faulted,
        );
        await rejects(
          "reuse: invalid output",
          "return NaN;",
          null,
          "INVALID_OUTPUT",
          undefined,
          faulted,
        );
        await rejects(
          "reuse: guest timeout",
          "while (true) {}",
          null,
          "TIMEOUT",
          { timeoutMs: 30 },
          faulted,
        );
        await rejects(
          "reuse: stack overflow",
          "function f() { return f() + 1; } return f();",
          null,
          "STACK_OVERFLOW",
          undefined,
          faulted,
        );
        await rejects(
          "reuse: memory limit",
          'const a = []; while (true) a.push("x".repeat(1024));',
          null,
          "MEMORY_LIMIT",
          { memoryLimitBytes: 1024 * 1024 },
          faulted,
        );
        record(
          "Worker reused after guest failures",
          (await faulted.execute("return 5;", null)) === 5 && created === 1 && stopped === 0,
        );

        dropExecution = true;
        const timeout = await faulted
          .execute("return 1;", null, { timeoutMs: 30 })
          .catch(error => error.code);
        record(
          "host watchdog terminates unresponsive Worker",
          timeout === "TIMEOUT" && stopped === 1,
        );
        dropExecution = false;
        record("recovery after host timeout", (await faulted.execute("return 3;", null)) === 3);
        const broken = faulted.execute("while (true) {}", null).catch(error => error.code);
        latestWorker.dispatchEvent(new MessageEvent("messageerror"));
        const brokenCode = await broken;
        record(`communication failure (${brokenCode})`, brokenCode === "WORKER_ERROR");
        record(
          "recovery after communication failure",
          (await faulted.execute("return 4;", null)) === 4,
        );
      } finally {
        faulted.dispose();
        window.Worker = NativeWorker;
      }
      return results;
    });
    assert.deepEqual(pageErrors, []);
    console.log(`${mode}: ${results.length} checks passed\n${results.join("\n")}`);
  } finally {
    await page.close();
  }
}

try {
  const dev = await createServer({ ...config, server: { host: "127.0.0.1", port: 0 } });
  try {
    await dev.listen();
    await check(`http://127.0.0.1:${dev.httpServer.address().port}/runtime-test/`, "dev");
  } finally {
    await dev.close();
  }
  const production = await preview({ ...config, preview: { host: "127.0.0.1", port: 0 } });
  try {
    await check(
      `http://127.0.0.1:${production.httpServer.address().port}/runtime-test/`,
      "production",
    );
  } finally {
    await new Promise(resolve => production.httpServer.close(resolve));
  }
} finally {
  await browser.close();
}
