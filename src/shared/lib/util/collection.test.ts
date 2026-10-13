import { insertAt, moveAt, removeAt } from "@src/shared/lib/util/collection";
import { describe, expect, test } from "vitest";

const items = ["a", "b", "c"];

describe("配列の操作", () => {
  test("挿入: 先頭・途中・末尾に入れる。元の配列は変えない", () => {
    expect(insertAt(items, 0, "x")).toEqual(["x", "a", "b", "c"]);
    expect(insertAt(items, 1, "x")).toEqual(["a", "x", "b", "c"]);
    expect(insertAt(items, 3, "x")).toEqual(["a", "b", "c", "x"]);
    expect(items).toEqual(["a", "b", "c"]);
  });

  test("挿入: 範囲の外なら、何もしない（新しい配列を返す）", () => {
    expect(insertAt(items, -1, "x")).toEqual(items);
    expect(insertAt(items, 4, "x")).toEqual(items);
    expect(insertAt(items, 4, "x")).not.toBe(items);
  });

  test("削除: 指定した位置の要素を除く。範囲の外なら何もしない", () => {
    expect(removeAt(items, 0)).toEqual(["b", "c"]);
    expect(removeAt(items, 2)).toEqual(["a", "b"]);
    expect(removeAt(items, 3)).toEqual(items);
    expect(removeAt(items, -1)).toEqual(items);
    expect(items).toEqual(["a", "b", "c"]);
  });

  test("移動: 前へも後ろへも移せる", () => {
    expect(moveAt(items, 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveAt(items, 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveAt(items, 0, 1)).toEqual(["b", "a", "c"]);
    expect(items).toEqual(["a", "b", "c"]);
  });

  test("移動: 同じ位置や、範囲の外なら何もしない", () => {
    expect(moveAt(items, 1, 1)).toEqual(items);
    expect(moveAt(items, 0, -1)).toEqual(items);
    expect(moveAt(items, 2, 3)).toEqual(items);
    expect(moveAt(items, 3, 0)).toEqual(items);
  });
});
