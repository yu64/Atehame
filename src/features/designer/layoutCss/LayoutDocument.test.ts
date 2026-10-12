import { LayoutDocument } from "@src/features/designer/layoutCss";
import { describe, expect, test } from "vitest";

const base = '@page { size: 100mm 148mm; }\n\n[data-name="a"] {\n  left: 10mm;\n  top: 10mm;\n}\n';

describe("LayoutDocument", () => {
  test("書き換えると新しい文書を返し、元の文書は変わらない", () => {
    const layout = LayoutDocument.from(base);
    const moved = layout.setDeclaration({ element: "a" }, "left", "20mm");
    expect(moved).not.toBe(layout);
    expect(layout.element("a")?.declarations.get("left")?.value).toBe("10mm");
    expect(moved.element("a")?.declarations.get("left")?.value).toBe("20mm");
  });

  test("CSS が変わらなければ同じ文書を返す", () => {
    const layout = LayoutDocument.from(base);
    expect(layout.setDeclaration({ element: "a" }, "left", "10mm")).toBe(layout);
    expect(layout.removeElement("ない")).toBe(layout);
    expect(layout.withCss(base)).toBe(layout);
  });

  test("解析は1回だけ行う", () => {
    const layout = LayoutDocument.from(base);
    expect(layout.parsed).toBe(layout.parsed);
    expect(layout.elements).toBe(layout.parsed.elements);
    expect(layout.pageSize).toEqual({
      width: 100,
      height: 148,
    });
  });
});

describe("LayoutDocument の画像", () => {
  const png = {
    type: "image/png",
    data: "iVBORw0KGgo=",
  } as const;
  const css = `[data-name="ロゴ"] {
  --atehame-image: "logo";
}
@media print {
  [data-name="ロゴ"] { --atehame-image: "logo"; }
}
`;

  test("CSS を書き換えても画像は引き継ぐ。画像を変えても解析結果は引き継ぐ", () => {
    const layout = LayoutDocument.from(css).setAsset("logo", png);
    const parsed = layout.parsed;
    expect(layout.setDeclaration({ element: "ロゴ" }, "left", "1mm").assets).toBe(layout.assets);
    expect(layout.setAsset("other", png).parsed).toBe(parsed);
  });

  test("画像の名前を変えると、参照している宣言も書き換える", () => {
    const layout = LayoutDocument.from(css).setAsset("logo", png).renameAsset("logo", "印影");
    expect(Object.keys(layout.assets)).toEqual(["印影"]);
    expect(layout.css).not.toContain('"logo"');
    expect(layout.css.match(/"印影"/g)).toHaveLength(2);
    expect(layout.assetUsage("印影")).toEqual(["ロゴ"]);
  });

  test("同じ名前の画像があれば名前を変えない。取り除いても部品は残る", () => {
    const layout = LayoutDocument.from(css).setAsset("logo", png).setAsset("b", png);
    expect(layout.renameAsset("logo", "b")).toBe(layout);
    const removed = layout.removeAsset("logo");
    expect(Object.keys(removed.assets)).toEqual(["b"]);
    expect(removed.element("ロゴ")).toBeDefined();
  });
});
