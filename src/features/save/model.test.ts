import {
  createTemplateFile,
  parseTemplateFile,
  serializeTemplateFile,
  toFileName,
} from "@src/features/save/model";
import { describe, expect, test } from "vitest";

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
