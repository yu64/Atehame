# Atehame

CSV の内容を、はがきや封筒のレイアウトに当てはめて印刷する Web アプリです。

- **テンプレートを作る**: CSV のカラムを決め、JavaScript で値を加工し、印刷用のレイアウトをデザインして、テンプレートのファイルとして保存します。
- **テンプレートを使う**: テンプレートと CSV を読み込み、行ごとの仕上がりを確かめて印刷します。

CSV もテンプレートも、ブラウザの中だけで処理します。外へは送信しません。

## 公開先

<https://yu64.github.io/Atehame/>

## 開発

```powershell
npm install
npm run dev
```

| コマンド            | 内容                                       |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | 開発サーバーを起動する                     |
| `npm run build`     | 本番用にビルドする（`dist/client` に出力） |
| `npm run format`    | 整形する（ESLint → Prettier → ESLint）     |
| `npm run lint`      | lint を実行する                            |
| `npm run test:unit` | 単体テストを実行する                       |

`main` にプッシュすると、GitHub Actions がテストとビルドを行い、GitHub Pages に公開します（[deploy-pages.yaml](.github/workflows/deploy-pages.yaml)）。

## ライセンス

[MIT](LICENSE)
