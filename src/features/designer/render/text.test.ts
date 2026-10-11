import {
  formatValue,
  splitTateChuYoko,
  tateChuYokoDigits,
} from "@src/features/designer/render/text";
import { describe, expect, test } from "vitest";

describe("縦中横", () => {
  test("指定桁数以下の半角数字だけを縦中横にする", () => {
    expect(splitTateChuYoko("道玄坂1丁目23番456号", 2)).toEqual([
      { text: "道玄坂", combine: false },
      { text: "1", combine: true },
      { text: "丁目", combine: false },
      { text: "23", combine: true },
      { text: "番456号", combine: false },
    ]);
  });

  test("0 なら分割しない", () => {
    expect(splitTateChuYoko("12", 0)).toEqual([{ text: "12", combine: false }]);
    expect(splitTateChuYoko("", 2)).toEqual([]);
  });

  test.each([
    ["digits", 2],
    ["digits 3", 3],
    [" DIGITS 4 ", 4],
    ["all", 0],
    ["none", 0],
    [undefined, 0],
  ])("text-combine-upright: %s → %i 桁", (value, expected) => {
    expect(tateChuYokoDigits(value)).toBe(expected);
  });
});
describe("値の文字列化", () => {
  test.each([
    ["文字列", "山田", "山田"],
    ["数値", 42, "42"],
    ["null", null, ""],
    ["undefined", undefined, ""],
    ["オブジェクト", { a: 1 }, ""],
    ["配列", [1], ""],
  ])("%s", (_, value, expected) => {
    expect(formatValue(value as never)).toBe(expected);
  });
});
