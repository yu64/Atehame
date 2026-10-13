import { keyCommand, type KeyInput } from "@src/features/designer/hooks/keyCommand";
import { pxPerMm } from "@src/shared/lib/units";
import { describe, expect, test } from "vitest";

/** キーの入力。修飾キーは、指定したものだけ押している。 */
function input(key: string, modifiers: Partial<Omit<KeyInput, "key">> = {}): KeyInput {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...modifiers,
  };
}

describe("キー操作の割り当て", () => {
  test("Ctrl+Z で元に戻す。Ctrl+Y と Ctrl+Shift+Z でやり直す", () => {
    expect(keyCommand(input("z", { ctrlKey: true }))).toEqual({ type: "undo" });
    expect(keyCommand(input("y", { ctrlKey: true }))).toEqual({ type: "redo" });
    const redo = input("Z", {
      ctrlKey: true,
      shiftKey: true,
    });
    expect(keyCommand(redo)).toEqual({ type: "redo" });
  });

  test("Mac の Command も Ctrl と同じに扱う", () => {
    expect(keyCommand(input("z", { metaKey: true }))).toEqual({ type: "undo" });
    expect(keyCommand(input("d", { metaKey: true }))).toEqual({ type: "duplicate" });
  });

  test("Ctrl+D で複製、Delete と Backspace で削除、Esc で選択を外す", () => {
    expect(keyCommand(input("d", { ctrlKey: true }))).toEqual({ type: "duplicate" });
    expect(keyCommand(input("Delete"))).toEqual({ type: "remove" });
    expect(keyCommand(input("Backspace"))).toEqual({ type: "remove" });
    expect(keyCommand(input("Escape"))).toEqual({ type: "deselect" });
  });

  test("矢印キーで 1px、Shift と矢印キーで 1mm 動かす", () => {
    const px = 1 / pxPerMm;
    expect(keyCommand(input("ArrowLeft"))).toEqual({
      type: "nudge",
      dx: -px,
      dy: 0,
    });
    expect(keyCommand(input("ArrowDown"))).toEqual({
      type: "nudge",
      dx: 0,
      dy: px,
    });
    expect(keyCommand(input("ArrowRight", { shiftKey: true }))).toEqual({
      type: "nudge",
      dx: 1,
      dy: 0,
    });
    expect(keyCommand(input("ArrowUp", { shiftKey: true }))).toEqual({
      type: "nudge",
      dx: 0,
      dy: -1,
    });
  });

  test("割り当てのないキーと、修飾キーのない文字は何もしない", () => {
    expect(keyCommand(input("a"))).toBeUndefined();
    expect(keyCommand(input("z"))).toBeUndefined();
    expect(keyCommand(input("d"))).toBeUndefined();
    expect(keyCommand(input("Enter"))).toBeUndefined();
    expect(keyCommand(input("s", { ctrlKey: true }))).toBeUndefined();
  });
});
