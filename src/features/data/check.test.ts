import { templateWarnings } from "@src/features/data/check";
import { createTemplate } from "@src/features/data/model";
import { describe, expect, test } from "vitest";

describe("保存の前の確認", () => {
  test("名前・カラム・レイアウトの問題を挙げる", () => {
    const template = createTemplate();
    const warnings = templateWarnings(template);
    expect(warnings).toContain("スキーマにカラムがありません。");
    expect(warnings).toContain("レイアウト: レイアウトに部品がありません。");
    expect(warnings.some(warning => warning.startsWith("テンプレートの名前がありません"))).toBe(
      true,
    );
  });

  test("カラム名の空と重複、登録されていない画像", () => {
    const template = {
      ...createTemplate(),
      name: "年賀状",
      schema: {
        version: 1 as const,
        fields: [
          {
            id: "a",
            name: "氏名",
            type: "string" as const,
            memo: "",
          },
          {
            id: "b",
            name: "氏名",
            type: "string" as const,
            memo: "",
          },
          {
            id: "c",
            name: "",
            type: "string" as const,
            memo: "",
          },
        ],
      },
      layout: {
        version: 1 as const,
        css: '[data-name="ロゴ"] { --atehame-image: "logo"; }',
      },
    };
    expect(templateWarnings(template)).toEqual([
      "スキーマに名前のないカラムがあります（加工の input に含まれません）。",
      "スキーマのカラム名「氏名」が重複しています。",
      "レイアウト: 画像「logo」が登録されていません。",
    ]);
  });

  test("空白だけのカラム名は名前なし、前後の空白だけが違う名前は重複として挙げる", () => {
    const template = {
      ...createTemplate(),
      name: "年賀状",
      schema: {
        version: 1 as const,
        fields: ["氏名", " 氏名", "　"].map((name, index) => ({
          id: String(index),
          name,
          type: "string" as const,
          memo: "",
        })),
      },
      layout: {
        version: 1 as const,
        css: '[data-name="宛名"] { --atehame-text: "{氏名}"; }',
      },
    };
    expect(templateWarnings(template)).toEqual([
      "スキーマに名前のないカラムがあります（加工の input に含まれません）。",
      "スキーマのカラム名「氏名」が重複しています。",
    ]);
  });

  test("問題がなければ空", () => {
    const template = {
      ...createTemplate(),
      name: "年賀状",
      schema: {
        version: 1 as const,
        fields: [
          {
            id: "a",
            name: "氏名",
            type: "string" as const,
            memo: "",
          },
        ],
      },
      layout: {
        version: 1 as const,
        css: '[data-name="宛名"] { --atehame-text: "{氏名}"; }',
      },
    };
    expect(templateWarnings(template)).toEqual([]);
  });
});
