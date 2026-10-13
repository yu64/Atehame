// 関数集（library.js）の型と説明。エディターの補完にそのまま渡す（source.ts）。
// import は使えない。`export` は補完に渡すときに取り除く。

// #############################################################################
// MARK: 型定義

/** 加工のコードから使える関数集。`atehame.関数名(...)` で呼ぶ。 */
export interface Atehame {
  /**
   * 文字の中の数字（半角・全角）を漢数字にする。縦書きの番地などに使う。
   * - `style: "place"`（既定）: 位取りする。`"1丁目23番4号"` → `"一丁目二十三番四号"`、`"1500"` → `"千五百"`
   * - `style: "digit"`: 1桁ずつ。`"1丁目23番4号"` → `"一丁目二三番四号"`、`"105"` → `"一〇五"`
   *
   * 小数点やカンマで区切られた数字は、それぞれ別の数として変換する。
   * @param text 変換する文字。null は空の文字、数値は文字にしてから変換する。
   */
  toKanjiNumber(
    text: string | number | null | undefined,
    options?: { style?: "place" | "digit" },
  ): string;

  /**
   * 英数字・記号・空白を全角に、半角カナを全角カナにする。縦書きで英数字を立てて並べるときに使う。
   * 例: `"A-1 ｶﾞｰﾃﾞﾝ"` → `"Ａ－１\u3000ガーデン"`
   * @param text 変換する文字。null は空の文字。
   */
  toFullWidth(text: string | number | null | undefined): string;

  /**
   * 全角の英数字・記号・空白を半角にする。カナはそのまま。入力の揺れをそろえるときに使う。
   * 例: `"ＡＢＣ１２３\u3000ビル"` → `"ABC123 ビル"`
   * @param text 変換する文字。null は空の文字。
   */
  toHalfWidth(text: string | number | null | undefined): string;

  /**
   * ハイフン・ダッシュ・マイナスなどの横棒を、指定した文字にそろえる。
   * 数字に挟まれた長音記号「ー」（`"1ー2"` の打ち間違い）も対象にする。
   * 例: `replaceHyphen("1-2－3", "の")` → `"1の2の3"`。
   * 縦書きなら全角の `"－"`（短い縦棒になる）や `"の"` がよい。半角の `"-"` は横に寝て半分の幅になり、
   * `"｜"` は横棒になる。
   * @param text 変換する文字。null は空の文字。
   * @param replacement 置き換える文字。
   */
  replaceHyphen(text: string | number | null | undefined, replacement: string): string;

  /**
   * 郵便番号を7桁の数字にする。7桁にならなければ null。
   * 「〒」・空白・横棒は取り除き、全角の数字は半角にする。数値は先頭の0を補う（`600001` → `"0600001"`）。
   * - `hyphen: true`: `"150-0043"` の形にする。
   * @param value 郵便番号。
   */
  toPostalCode(
    value: string | number | null | undefined,
    options?: { hyphen?: boolean },
  ): string | null;

  /**
   * 日付を和暦にする。読めない日付や、明治6年（1873年）より前の日付は null。
   * 日付は `"2026-10-13"`・`"2026/10/13"`・`"2026年10月13日"` の形（後ろに時刻があってもよい）。
   * - `format`: 書式。`{era}`・`{year}`・`{month}`・`{day}` を置き換える。既定は `"{era}{year}年{month}月{day}日"`。
   * - `gannen: false`: 1年を「元」でなく「1」と書く。
   *
   * 例: `"2026-10-13"` → `"令和8年10月13日"`、`"2019-05-01"` → `"令和元年5月1日"`。
   * 漢数字にするなら `toKanjiNumber(toJpEra(date))`。
   * @param date 日付。
   */
  toJpEra(
    date: string | null | undefined,
    options?: { format?: string; gannen?: boolean },
  ): string | null;
}
