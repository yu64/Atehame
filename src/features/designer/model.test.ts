import { LayoutDocument } from "@src/features/designer/layoutCss";
import {
  createLayout,
  layoutSchema,
  paperPresetOf,
  paperSizeOf,
  toLayoutDocument,
} from "@src/features/designer/model";
import { describe, expect, test } from "vitest";

describe("レイアウト", () => {
  test("用紙を @page で表す", () => {
    const layout = createLayout("nagagata3");
    expect(paperSizeOf(toLayoutDocument(layout))).toEqual({ width: 120, height: 235 });
    expect(paperPresetOf(paperSizeOf(toLayoutDocument(layout)))).toBe("nagagata3");
    expect(layoutSchema.safeParse(layout).success).toBe(true);
  });

  test("用紙サイズがなければはがき", () => {
    expect(paperSizeOf(LayoutDocument.from(""))).toEqual({ width: 100, height: 148 });
    expect(paperPresetOf({ width: 101, height: 148 })).toBeUndefined();
  });

  test("不正な値は拒否する", () => {
    expect(layoutSchema.safeParse({ version: 2, css: "" }).success).toBe(false);
    expect(layoutSchema.safeParse({ version: 1, css: 1 }).success).toBe(false);
  });
});
