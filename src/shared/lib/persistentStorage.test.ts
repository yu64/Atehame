// @vitest-environment happy-dom
import { createPersistentStorage } from "@src/shared/lib/persistentStorage";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/** 数だけを正しい値として受け取る。 */
function parse(value: unknown) {
  return (typeof value === "number" ? value : undefined);
}

describe("localStorage に保存する入れ物", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  test("書き込みは少し待ってまとめて行い、最後の値だけを書く", () => {
    const storage = createPersistentStorage({ parse, delayMs: 500 });
    storage.setItem("n", 1);
    storage.setItem("n", 2);
    expect(localStorage.getItem("n")).toBeNull();
    // 書き込む前でも、読むと最新の値が返る。
    expect(storage.getItem("n", 0)).toBe(2);
    vi.advanceTimersByTime(500);
    expect(localStorage.getItem("n")).toBe("2");
  });

  test("flush ですぐに書き込む", () => {
    const storage = createPersistentStorage({ parse });
    storage.setItem("n", 3);
    storage.flush();
    expect(localStorage.getItem("n")).toBe("3");
  });

  test("壊れた値や形の違う値は使わず、初めの値を返す", () => {
    const storage = createPersistentStorage({ parse });
    localStorage.setItem("broken", "{");
    localStorage.setItem("wrong", '"text"');
    expect(storage.getItem("broken", 7)).toBe(7);
    expect(storage.getItem("wrong", 7)).toBe(7);
    expect(storage.getItem("missing", 7)).toBe(7);
  });

  test("書き込めなくても例外にせず、onError で知らせる", () => {
    const onError = vi.fn();
    const full = {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    } as unknown as Storage;
    const storage = createPersistentStorage({ parse, onError, storage: () => full });
    storage.setItem("n", 1);
    expect(() => storage.flush()).not.toThrow();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
