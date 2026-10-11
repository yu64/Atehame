# レイアウト CSS

レイアウトは CSS だけで表す。デザイナーの操作もすべて、この CSS の書き換えになる。
CSS は作成者が書いたまま保存し、表示や印刷のたびに安全化する（`render/sanitizeCss.ts`）。

## 約束事

| 書き方                                                      | 意味                                                                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `[data-name="名前"] { … }`                                  | 最上位にあり、セレクタがこれだけの規則が「部品」になる。記述順が重なり順。                         |
| `--atehame-text: "{氏名} 様";`                              | 部品に表示する文字。`{カラム名}` に加工の出力の値が入る。`{{` `}}` は波括弧そのもの、`\A` は改行。 |
| `--atehame-split: char;`                                    | 文字を1文字ずつ `[data-part="char"]` に分ける（郵便番号の枠など）。                                |
| `text-combine-upright: digits 2;`                           | CSS 標準の値。Chrome などは未対応のため、描画時に数字の並びを囲んで再現する。                      |
| `@page { size: 100mm 148mm; }`                              | 用紙サイズ。`@page` では `size` と `margin` だけが使える。                                         |
| `var(--atehame-font-mincho)` / `var(--atehame-font-gothic)` | 明朝・ゴシックのフォントの候補（端末のフォントを使う）。                                           |

部品を定義しない普通の規則（`[data-name="氏名"]::after`、`@media screen`、`:nth-child` など）は、
見た目の調整としてそのまま効く。同じ名前の規則が複数ある場合は、最初の規則を部品の定義とし、
デザイナーの設定パネルはその規則を読み書きする。

部品の中身:

- 通常: `[data-name="名前"] > [data-part="content"]` の中に文字が入る。
- `--atehame-split: char` の場合: `[data-name="名前"] > [data-part="char"]` が1文字ずつ並ぶ。

部品は `display: flex; flex-direction: column` の箱として配置される（`left` / `top` / `width` / `height` で位置と大きさ）。
基本の CSS は詳細度 0 の `:where()` で書いてあり、作成者の CSS で必ず上書きできる。

## 例

```css
@page {
  size: 100mm 148mm;
}

[data-name="宛名"] {
  --atehame-text: "{氏名} 様";
  left: 40mm;
  top: 30mm;
  width: 20mm;
  height: 100mm;
  writing-mode: vertical-rl;
  font-size: 26pt;
  letter-spacing: 0.2em;
  justify-content: center;
}

[data-name="郵便番号"] {
  --atehame-text: "{郵便番号}";
  --atehame-split: char;
  left: 44mm;
  top: 12mm;
  flex-direction: row;

  /* 中身の調整は入れ子で書くと、部品といっしょに複製・削除される。 */
  & > [data-part="char"] {
    width: 5.7mm;
    text-align: center;
  }
  & > [data-part="char"]:nth-child(n + 2) {
    margin-inline-start: 1.3mm;
  }
}
```

デザイナーで部品を削除すると、その部品だけを指定する規則（`@media` の中も含む）と直前のコメントも
いっしょに削除する。ほかの部品と `,` で並べたセレクタは、その部分だけを削除する。

## 構成

- `LayoutDocument.ts`: CSS と解析結果をまとめた不変のクラス。書き換えると新しい文書を返し、解析は必要になったときに1回だけ行う。アプリからはこれを通して使う。
- `parse.ts`: 部品・`@page`・宣言の位置を読む。書きかけの CSS も読める範囲で読む。
- `edit.ts`: 位置を使って対象の範囲だけを置き換える。コメントや書き方は残す。
- `remove.ts`: 部品の削除。部品を指定するほかの規則もまとめて取り除く。
- `ranges.ts`: 範囲の置き換えと、規則を取り除く範囲（前のコメントや空行を含む）の計算。
- `textTemplate.ts`: `{カラム名}` の埋め込み。
- `cssString.ts`: CSS の文字列の読み書き。
