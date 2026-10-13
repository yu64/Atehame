import { decodeText } from "@src/shared/lib/textFile";
import { describe, expect, test } from "vitest";

describe("テキストファイルの文字コード", () => {
  test("UTF-8（BOM あり）は BOM を除いて読む", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("住所")]);
    expect(decodeText(bytes)).toEqual({
      text: "住所",
      encoding: "utf-8",
    });
  });

  test("UTF-8（BOM なし）", () => {
    expect(decodeText(new TextEncoder().encode("氏名,住所"))).toEqual({
      text: "氏名,住所",
      encoding: "utf-8",
    });
  });

  test("UTF-8 として読めなければ Shift_JIS として読む", () => {
    // 「住所」の Shift_JIS
    const bytes = new Uint8Array([0x8f, 0x5a, 0x8f, 0x8a]);
    expect(decodeText(bytes)).toEqual({
      text: "住所",
      encoding: "shift_jis",
    });
  });
});
