import { LayoutDocument } from "@src/features/designer/layoutCss";
import { ElementIds } from "@src/features/designer/state/elementIds";
import { describe, expect, test } from "vitest";

const layout = LayoutDocument.from('[data-name="a"] {}\n[data-name="b"] {}\n');

describe("部品の ID", () => {
  test("前の版から名前で引き継ぎ、新しい部品には新しい ID を付ける", () => {
    const ids = new ElementIds();
    ids.register(layout);
    const next = layout.withCss(`${layout.css}[data-name="c"] {}\n`);
    ids.register(next, layout);

    expect(ids.idOf(next, "a")).toBe(ids.idOf(layout, "a"));
    expect(ids.idOf(next, "b")).toBe(ids.idOf(layout, "b"));
    expect(ids.idOf(next, "c")).toBeDefined();
    expect(new Set(["a", "b", "c"].map(name => ids.idOf(next, name))).size).toBe(3);
  });

  test("名前の変更は、古い名前の ID を新しい名前へ引き継ぐ", () => {
    const ids = new ElementIds();
    ids.register(layout);
    const renamed = layout.renameElement("a", "x");
    ids.register(renamed, layout, { from: "a", to: "x" });

    const id = ids.idOf(layout, "a")!;
    expect(ids.idOf(renamed, "x")).toBe(id);
    expect(ids.nameOf(renamed, id)).toBe("x");
    // 前の版の対応表はそのまま残る（元に戻すと前の名前を指す）。
    expect(ids.nameOf(layout, id)).toBe("a");
  });

  test("CSS を直接書き換えて名前が変わった部品は、別の部品として扱う", () => {
    const ids = new ElementIds();
    ids.register(layout);
    const edited = layout.withCss(layout.css.replace('"a"', '"x"'));
    ids.register(edited, layout);

    const id = ids.idOf(layout, "a")!;
    expect(ids.nameOf(edited, id)).toBeUndefined();
    expect(ids.idOf(edited, "x")).not.toBe(id);
  });
});
