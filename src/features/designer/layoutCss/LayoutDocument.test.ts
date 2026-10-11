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
    expect(layout.pageSize).toEqual({ width: 100, height: 148 });
  });
});
