import { decodeCssString, LayoutDocument, textProperty } from "@src/features/designer/layoutCss";
import { createLayout } from "@src/features/designer/model";
import { postalCodePreset, textPreset } from "@src/features/designer/presets";
import {
  addFromPreset,
  duplicateElement,
  moveElementBy,
  placeElement,
  uniqueName,
} from "@src/features/designer/state/operations";
import { describe, expect, test } from "vitest";

describe("デザイナーの操作", () => {
  const paper = {
    width: 100,
    height: 148,
  };
  const base = LayoutDocument.from(createLayout("hagaki").css);

  test("名前の重複を避ける", () => {
    expect(uniqueName(["氏名", "氏名 2"], "氏名")).toBe("氏名 3");
    expect(uniqueName([], " ")).toBe("部品");
  });

  test("値の名前から、その値を埋め込んだテキストを追加する", () => {
    const { layout, name } = addFromPreset(base, textPreset, {
      key: "氏名",
      fields: ["氏名"],
      assets: [],
      paper,
    });
    const rule = layout.elements[0];
    expect(name).toBe("氏名");
    expect(decodeCssString(rule.declarations.get(textProperty)!.value)).toBe("{氏名}");
    expect(rule.declarations.get("writing-mode")?.value).toBe("vertical-rl");
  });

  test("同じ値をもう一度追加すると名前に番号を付ける", () => {
    const first = addFromPreset(base, textPreset, {
      key: "氏名",
      fields: [],
      assets: [],
      paper,
    });
    const second = addFromPreset(first.layout, textPreset, {
      key: "氏名",
      fields: [],
      assets: [],
      paper,
    });
    expect(second.name).toBe("氏名 2");
  });

  test("郵便番号枠は1文字ずつ分け、郵便番号らしい値を埋め込む", () => {
    const { layout } = addFromPreset(base, postalCodePreset, {
      fields: ["氏名", "郵便番号"],
      assets: [],
      paper,
    });
    const rule = layout.elements[0];
    expect(rule.name).toBe("郵便番号");
    expect(rule.declarations.get("--atehame-split")?.value).toBe("char");
    expect(rule.declarations.get("font-family")?.value).toBe("var(--atehame-font-mincho)");
    expect(layout.css).toContain('  & > [data-part="char"]:nth-child(4) {');
    // 各桁の調整は部品の規則の中にあるため、部品を消せば残らない。
    expect(layout.removeElement("郵便番号").css).toBe(base.css);
  });

  test("位置を設定し、ずらす", () => {
    let { layout } = addFromPreset(base, textPreset, {
      key: "a",
      fields: [],
      assets: [],
      paper,
    });
    layout = placeElement(layout, "a", {
      left: 10,
      top: 20,
    });
    layout = moveElementBy(layout, "a", 0.5, -1, undefined);
    const rule = layout.elements[0];
    expect(rule.declarations.get("left")?.value).toBe("10.5mm");
    expect(rule.declarations.get("top")?.value).toBe("19mm");
  });

  test("位置が mm で読めない場合は表示上の位置からずらす", () => {
    const layout = LayoutDocument.from('[data-name="a"] { left: 50%; }');
    const moved = moveElementBy(layout, "a", 1, 1, {
      left: 30,
      top: 40,
      width: 1,
      height: 1,
    });
    expect(moved.elements[0].declarations.get("left")?.value).toBe("31mm");
    expect(moved.elements[0].declarations.get("top")?.value).toBe("41mm");
  });

  test("複製は名前を変えてずらす", () => {
    const layout = LayoutDocument.from('[data-name="a"] { left: 10mm; top: 10mm; color: red; }');
    const result = duplicateElement(layout, "a", undefined);
    const copy = result.layout.elements[1];
    expect(result.name).toBe("a のコピー");
    expect(copy.declarations.get("left")?.value).toBe("13mm");
    expect(copy.declarations.get("color")?.value).toBe("red");
  });
});
