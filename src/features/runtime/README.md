# JavaScript加工エンジン

Vite標準の `new Worker(new URL(..., import.meta.url))` を使用する。
Workerプラグインは不要。`vite.config.ts` の `worker.format: 'es'` でビルドする。
QuickJSはWASM同梱版を使用し、実行時にCDNや別のWASMファイルを取得しない。

## 構成

- `JsExecutionEngine.ts`: 公開API、入力検証、Workerの寿命、タイムアウト・キャンセル。
- `protocol.ts`: 入出力の型、制限値、Comlinkで公開するWorker API。
- `quickjs.worker.ts`: Comlinkの `expose()` とQuickJSモジュールの初期化。
- `executeInQuickJS.ts`: ゲストコード実行、結果検証、QuickJSリソースの破棄。

通信はComlinkの `wrap()` / `expose()` に任せ、要求IDや応答イベントは手動管理しない。
エラーコードを維持するため、Workerは成功・失敗を表すデータを返し、呼び出し側で
`JsExecutionError` に変換する。隔離はQuickJS、通信はComlinkが担当する。

```ts
import { JsExecutionEngine, JsExecutionError } from "@src/features/runtime";

const engine = new JsExecutionEngine();
try {
  const result = await engine.execute(
    `return {
      name: input.name + ' 様',
      address: [input.address, input.building].filter(Boolean).join('\\n'),
    };`,
    { name: "山田 太郎", address: "東京都…", building: "…101号室" },
    { timeoutMs: 1000 },
  );
  console.log(result);
} catch (error) {
  if (error instanceof JsExecutionError) {
    console.error(error.code, error.message);
  }
} finally {
  engine.dispose();
}
```

## 契約

- コードは `input` を引数とする同期関数の**本体**。`return` で結果を返す。
- 入出力はJSONデータ。日付は文字列で渡す。非有限数・BigInt・循環参照・関数・undefinedなどは拒否する。
- JSONシリアライズ規則に従うため、`toJSON` のある値はその返り値を検査する。
- Promiseを返す処理や外部モジュールのロードは非対応。非同期ジョブは実行しない。
- QuickJSのRuntime/Contextは毎回作成・破棄する。WorkerとWASMモジュールは再利用する。
- ゲスト側の失敗（例外・不正な出力・時間/メモリ/スタック上限）の後もWorkerは再利用する。
  キャンセル、通信失敗、ホスト側のタイムアウト、WASMの異常（`fatal`）の後だけ作り直す。
- 同じエンジンへの同時呼び出しは `BUSY`。CSVは `for ... of` と `await` で逐次処理する。
- `AbortSignal` でキャンセル可能。
- 画面を離れる際などに `dispose()` する。破棄後は再利用不可。

## エラー

失敗は `JsExecutionError` で通知する。`code` で種類を判別し、`message` は利用者に表示できる文言。
ユーザーコード上の位置を特定できた場合は `location`（1始まりの `line` / `column`）を持つ。

| コード                                        | 意味                                               |
| --------------------------------------------- | -------------------------------------------------- |
| `SCRIPT_ERROR`                                | 構文エラー、またはコードが投げた例外               |
| `MEMORY_LIMIT` / `STACK_OVERFLOW` / `TIMEOUT` | 各上限の超過                                       |
| `INVALID_OUTPUT` / `OUTPUT_LIMIT`             | 結果がJSONデータでない、またはサイズ超過           |
| `INVALID_INPUT`                               | コード・入力・制限値が不正（Workerへ送る前に検出） |
| `BUSY` / `ABORTED` / `DISPOSED`               | 呼び出し状態によるもの                             |
| `STARTUP_ERROR` / `WORKER_ERROR`              | WASMの初期化、Workerや通信の異常                   |

## 制限と隔離

| 項目           | 初期値／上限                 |
| -------------- | ---------------------------- |
| 実行時間       | 1秒（1〜10,000msで指定可能） |
| QuickJSヒープ  | 16MiB（1〜64MiBで指定可能）  |
| スタック       | 128KiB（再帰は約700段）      |
| コード         | 65,536 UTF-16コード単位      |
| 入力・出力JSON | 各1,048,576 UTF-16コード単位 |
| Worker初期化   | 15秒                         |

QuickJS側の割り込みに加え、ホストのタイマーでも制限時間+100msを超えたWorkerを終了する。
バックグラウンドタブのタイマー抑制などにより、厳密な実時間の保証はしない。
メモリ上限はQuickJSヒープに適用され、ブラウザやWASM全体の使用量の上限ではない。

WASMの関数呼び出しはWorkerのネイティブスタックも消費する。ChromeのWorkerでは
QuickJSのスタック上限を256KiB以上にすると、QuickJSが検出する前にブラウザ側があふれ、
WASMの状態が壊れる。そのためスタック上限は128KiBとし、それでもブラウザ側があふれた場合は
`fatal` としてWorkerを破棄する（壊れたRuntimeは解放しない）。

コードはブラウザのJSエンジンのevalではなく、QuickJSの中で実行される。
DOM・fetch・ストレージ・Worker・Node API・ホスト関数・モジュールローダーを公開しない。
Worker単体をセキュリティ境界とみなさない。ホストAPIを追加する場合は、公開する権限を再評価する。
QuickJS/WASM/ブラウザの脆弱性まで防ぐ保証ではないため、依存の更新と回帰テストが必要。

出力は加工データとして扱い、HTMLとして挿入しない。CSV行番号の付加、出力スキーマ検証、
住所変換ヘルパー、テンプレート保存、編集UIとの接続は呼び出し側で別途実装する。

## 検証

`npm run test:runtime`（インストール済みChromeを使用）。
Viteの開発サーバーと、本番ビルドをサブパスで配信した環境の両方でWorkerを実行する。
正常加工、状態隔離、利用不可API、入力・出力の不正値、時間・メモリ・スタック上限、
エラー位置、キャンセル、失敗後の再実行、破棄を検証する。
さらに、ゲスト側の失敗でWorkerを再利用すること、起動中のキャンセル、
応答しないWorkerの強制終了、通信エラーと復旧を含め、開発・本番それぞれ53項目を確認する。
