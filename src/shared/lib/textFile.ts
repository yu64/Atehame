// #############################################################################
// MARK: 型定義

/** 読み取れた文字コード。 */
export type TextEncoding = "utf-8" | "shift_jis";

export interface DecodedText {
  text: string;
  encoding: TextEncoding;
}

// #############################################################################
// MARK: 関数

/**
 * テキストファイルの中身を文字列にする。文字コードは UTF-8（BOM の有無を問わない）か Shift_JIS。
 * UTF-8 として正しく読めなければ Shift_JIS とみなす（Excel で保存した CSV は Shift_JIS が多い）。
 * BOM は取り除く。
 */
export function decodeText(bytes: Uint8Array): DecodedText {
  try {
    // fatal: 不正なバイト列があれば例外にする（読み違いを見分けるため）。BOM は既定で取り除かれる。
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      encoding: "utf-8",
    };
  } catch {
    return {
      text: new TextDecoder("shift_jis").decode(bytes),
      encoding: "shift_jis",
    };
  }
}
