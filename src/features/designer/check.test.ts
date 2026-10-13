import { layoutWarnings } from "@src/features/designer/check";
import { createLayout } from "@src/features/designer/model";
import { describe, expect, test } from "vitest";

/** CSS だけを指定したレイアウト。 */
function layoutOf(css: string) {
  return {
    ...createLayout(),
    css,
  };
}

describe("レイアウトの問題", () => {
  test("部品がなければ知らせる", () => {
    expect(layoutWarnings(layoutOf("@page { size: 100mm 148mm; }"))).toEqual([
      "レイアウトに部品がありません。",
    ]);
  });

  test("安全化で取り除く記述と、登録されていない画像を知らせる", () => {
    const warnings = layoutWarnings(
      layoutOf(
        '@import "https://example.com/x.css"; [data-name="ロゴ"] { --atehame-image: "logo"; }',
      ),
    );
    expect(warnings).toContain("画像「logo」が登録されていません。");
    expect(warnings.some(warning => warning.includes("@import"))).toBe(true);
    expect(warnings).not.toContain("レイアウトに部品がありません。");
  });

  test("問題がなければ空", () => {
    const layout = layoutOf('[data-name="宛名"] { --atehame-text: "{氏名}"; }');
    expect(layoutWarnings(layout)).toEqual([]);
  });
});
