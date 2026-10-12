import type { JsonValue } from "@src/shared/lib/json";

// #############################################################################
// MARK: 型定義

export interface TextRun {
  text: string;
  /** 縦中横（縦書きの中で横に並べる）にするか。 */
  combine: boolean;
}

// #############################################################################
// MARK: 関数

/** 加工の出力の値を表示用の文字列にする。オブジェクトや配列は表示できないため空にする。 */
export function formatValue(value: JsonValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value);
}

/** maxDigits 桁以下の半角数字の並びを縦中横にするよう分割する。 */
export function splitTateChuYoko(text: string, maxDigits: number): TextRun[] {
  if (maxDigits <= 0) {
    return (
      (text === "")
      ? []
      : [
        {
          text,
          combine: false,
        },
      ]
    );
  }

  const runs: TextRun[] = [];
  let last = 0;
  for (const match of text.matchAll(/[0-9]+/g)) {
    if (match[0].length > maxDigits) continue;
    if (match.index > last) {
      runs.push({
        text: text.slice(last, match.index),
        combine: false,
      });
    }
    runs.push({
      text: match[0],
      combine: true,
    });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    runs.push({
      text: text.slice(last),
      combine: false,
    });
  }
  return runs;
}

/**
 * text-combine-upright: digits [n] の桁数（n を省略すると 2）。それ以外は 0。
 * CSS の仕様にある値だが Chrome などは対応していないため、描画時に数字の並びを囲んで再現する。
 */
export function tateChuYokoDigits(value: string | undefined): number {
  const match = value
    ?.trim()
    .toLowerCase()
    .match(/^digits(?:\s+([2-4]))?$/);
  return (match ? Number(match[1] ?? 2) : 0);
}
