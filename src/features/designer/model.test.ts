import { LayoutDocument } from "@src/features/designer/layoutCss";
import {
  createLayout,
  fromLayoutDocument,
  layoutSchema,
  layoutSummary,
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

describe("レイアウトの画像", () => {
  const png = { type: "image/png", data: "iVBORw0KGgo=" } as const;

  test("概要には部品の数・用紙・画像の数と合計の大きさを出す", () => {
    const summary = layoutSummary({
      version: 1,
      css: '@page { size: 120mm 235mm; } [data-name="a"] {}',
      assets: { logo: png, mark: png },
    });
    expect(summary).toEqual({
      paper: { width: 120, height: 235 },
      elementCount: 1,
      imageCount: 2,
      imageBytes: 16,
    });
  });

  test("画像は保存する。なければ項目ごと省く", () => {
    const layout = { version: 1, css: "", assets: { logo: png } } as const;
    expect(fromLayoutDocument(toLayoutDocument(layout))).toEqual(layout);
    expect(fromLayoutDocument(toLayoutDocument({ version: 1, css: "" }))).toEqual({
      version: 1,
      css: "",
    });
  });

  test("読み込むときに、画像の形式・中身・大きさを確かめる", () => {
    const parse = (assets: unknown) =>
      layoutSchema.safeParse({ version: 1, css: "", assets }).success;
    expect(parse({ logo: png })).toBe(true);
    expect(parse({ logo: { type: "image/gif", data: png.data } })).toBe(false);
    expect(parse({ logo: { type: "image/png", data: "<script>" } })).toBe(false);
    expect(parse({ logo: { type: "image/png", data: "A".repeat(2_000_000) } })).toBe(false);
  });
});
