import { changedRange } from "@src/shared/lib/TextUtil";
import { describe, expect, test } from "vitest";

describe("文字列の差分", () => {
  test.each([
    ["abc", "abc", { start: 3, oldEnd: 3, newEnd: 3 }],
    ["left: 1mm;", "left: 12mm;", { start: 7, oldEnd: 7, newEnd: 8 }],
    ["aXc", "aYYc", { start: 1, oldEnd: 2, newEnd: 3 }],
    ["aaa", "aa", { start: 2, oldEnd: 3, newEnd: 2 }],
  ])("%s → %s", (before, after, expected) => {
    const range = changedRange(before, after);
    expect(range).toEqual(expected);
    expect(
      before.slice(0, range.start) +
        after.slice(range.start, range.newEnd) +
        before.slice(range.oldEnd),
    ).toBe(after);
  });
});
