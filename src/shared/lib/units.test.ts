import { formatBytes, formatMm, lengthToMm } from "@src/shared/lib/units";
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

  test("バイト数は、大きさに合わせた単位で書く", () => {
    expect(formatBytes(0)).toBe("0B");
    expect(formatBytes(1023)).toBe("1023B");
    expect(formatBytes(1024)).toBe("1KB");
    expect(formatBytes(820 * 1024)).toBe("820KB");
    expect(formatBytes(1024 * 1024)).toBe("1MB");
    expect(formatBytes(1.25 * 1024 * 1024)).toBe("1.3MB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10MB");
  });
});
