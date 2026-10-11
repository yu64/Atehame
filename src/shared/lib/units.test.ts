import { formatMm, lengthToMm } from "@src/shared/lib/units";
import { describe, expect, test } from "vitest";

describe("単位", () => {
  test.each([
    ["10mm", 10],
    ["1cm", 10],
    ["1in", 25.4],
    ["0", 0],
    ["auto", undefined],
  ])("長さ %s → %s mm", (value, expected) => {
    expect(lengthToMm(value)).toBe(expected);
  });

  test("mm は 0.01mm 単位で書く", () => {
    expect(formatMm(12.3456)).toBe("12.35mm");
    expect(formatMm(10)).toBe("10mm");
  });
});
