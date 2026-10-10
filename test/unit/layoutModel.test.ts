import { formatValue, splitTateChuYoko, tateChuYokoDigits } from "@src/logic/render/text";
import { changedRange } from "@src/logic/util/TextUtil";
import { LayoutDocument } from "@src/logic/layoutCss";
import {
  createLayout,
  layoutSchema,
  paperPresetOf,
  paperSizeOf,
  toLayoutDocument,
} from "@src/models/Layout";
import {
  createTemplateFile,
  parseTemplateFile,
  serializeTemplateFile,
  toFileName,
} from "@src/models/TemplateFile";
import { describe, expect, test } from "vitest";

describe("縦中横", () => {
  test("指定桁数以下の半角数字だけを縦中横にする", () => {
    expect(splitTateChuYoko("道玄坂1丁目23番456号", 2)).toEqual([
      { text: "道玄坂", combine: false },
      { text: "1", combine: true },
      { text: "丁目", combine: false },
      { text: "23", combine: true },
      { text: "番456号", combine: false },
    ]);
  });

  test("0 なら分割しない", () => {
    expect(splitTateChuYoko("12", 0)).toEqual([{ text: "12", combine: false }]);
    expect(splitTateChuYoko("", 2)).toEqual([]);
  });

  test.each([
    ["digits", 2],
    ["digits 3", 3],
    [" DIGITS 4 ", 4],
    ["all", 0],
    ["none", 0],
    [undefined, 0],
  ])("text-combine-upright: %s → %i 桁", (value, expected) => {
    expect(tateChuYokoDigits(value)).toBe(expected);
  });
});

describe("値の文字列化", () => {
  test.each([
    ["文字列", "山田", "山田"],
    ["数値", 42, "42"],
    ["null", null, ""],
    ["undefined", undefined, ""],
    ["オブジェクト", { a: 1 }, ""],
    ["配列", [1], ""],
  ])("%s", (_, value, expected) => {
    expect(formatValue(value as never)).toBe(expected);
  });
});

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

describe("テンプレートファイル", () => {
  const schema = {
    version: 1 as const,
    fields: [{ id: "f", name: "氏名", type: "string" as const, memo: "" }],
  };

  test("書き出したファイルを読み込める", () => {
    const layout = {
      version: 1 as const,
      css: '[data-name="氏名"] { --atehame-text: "{氏名} 様"; }',
    };
    const file = createTemplateFile("年賀状", schema, "return input;", layout);
    expect(parseTemplateFile(serializeTemplateFile(file))).toEqual({ ok: true, file });
  });

  test.each([
    ["JSON でない", "{"],
    ["形式が違う", JSON.stringify({ format: "other" })],
    ["バージョンが違う", JSON.stringify({ format: "atehame-template", version: 2 })],
  ])("%s場合は理由を返す", (_, json) => {
    expect(parseTemplateFile(json).ok).toBe(false);
  });

  test("ファイル名に使えない文字を置き換える", () => {
    expect(toFileName('年賀状/2027:"宛名"')).toBe("年賀状_2027__宛名_.atehame.json");
    expect(toFileName("  ")).toBe("template.atehame.json");
  });
});

describe("文字列の差分", () => {
  test.each([
    ["abc", "abc", { start: 3, oldEnd: 3, newEnd: 3 }],
    ["left: 1mm;", "left: 12mm;", { start: 7, oldEnd: 7, newEnd: 8 }],
    ["aXc", "aYYc", { start: 1, oldEnd: 2, newEnd: 3 }],
    ["aaa", "aa", { start: 2, oldEnd: 3, newEnd: 2 }],
  ])("%s → %s", (before, after, expected) => {
    const range = changedRange(before, after);
    expect(range).toEqual(expected);
    expect(
      before.slice(0, range.start) +
        after.slice(range.start, range.newEnd) +
        before.slice(range.oldEnd),
    ).toBe(after);
  });
});
