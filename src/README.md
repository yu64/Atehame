# src の構成

機能ごとにまとめ、1つの機能を追うときにトップレベルを行き来しなくて済むようにしている。

```
src/
├─ pages/      Vike のルーティングだけ。画面は features から読み込む（例: export { LayoutPage as default } from "@src/features/edit/layout"）
├─ features/   機能。画面を持つものと、画面を持たない部品・処理がある
├─ app/        アプリの枠（ヘッダー・ページの枠・見出し）と、アプリ全体の状態（ダークモード・言語）
├─ shared/     Atehame のことを知らない汎用部分
│   ├─ ui/     汎用の部品
│   ├─ hooks/  汎用のフック
│   └─ lib/    汎用の処理（React に依存しない）
└─ assets/     翻訳などの静的な資源
```

## 機能（features）

| 機能        | 画面 | 内容                                                                       |
| ----------- | ---- | -------------------------------------------------------------------------- |
| `schema`    | あり | CSV で受け取るカラムの定義（`DataSchema`）                                 |
| `transform` | あり | 加工のコードと、サンプルの値での試行（`TransformInput`）                   |
| `layout`    | あり | レイアウト画面。中身はデザイナーで、成果物（`Layout`）をアプリの状態に持つ |
| `save`      | あり | テンプレートの書き出し（`TemplateFile`）                                   |
| `designer`  | なし | レイアウトのデザイナー。CSS の約束事・描画・印刷もここだけが知っている     |
| `runtime`   | なし | JS の実行エンジン（QuickJS）。スキーマや画面のことは知らない               |

機能の中は、必要に応じて次のように分ける。

- `XxxPage.tsx`：画面
- `model.ts`：データの型・検証・既定値
- `store.ts`：アプリの状態（jotai の atom）
- `hooks/`：その機能のフック
- `index.ts`：ほかから使ってよいもの（入口）
- `*.test.ts`：単体テスト（対象のコードの隣に置く）

## 依存の決まりごと

```
pages → features → app → shared
```

- 依存は矢印の向きだけ。逆向きには読み込まない。
- **機能どうしは `index.ts` 越しに使う。** ほかの機能の中のファイルを直接読み込まない。
- 機能どうしの依存も一方向にする：`schema ← transform ← layout ← save`、`layout → designer`、`transform → runtime`。
- **画面を持たない機能（`designer`・`runtime`）は、ほかの機能と `app` を使わない。** アプリの状態にも依存せず、値は props や引数で受け取る。
- **`shared` は `app` にも機能にも依存しない。** アプリの状態（jotai）も読まない。

## テスト

- 単体テストは対象のコードの隣（`*.test.ts`）に置き、`npm run test:unit`（Vitest）で実行する。
- ブラウザを使う大きなテストは `test/` に置く（`test/print`・`test/runtime`）。
