import {
  createTemplate,
  fromTemplateFile,
  parseTemplateFile,
  serializeTemplateFile,
  toFileName,
  toTemplateFile,
} from "@src/features/template/model";
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
    const template = { name: "年賀状", schema, transform: { code: "return input;" }, layout };
    const file = toTemplateFile(template);
    expect(parseTemplateFile(serializeTemplateFile(file))).toEqual({ ok: true, file });
    expect(fromTemplateFile(file)).toEqual(template);
  });

  test("空のテンプレートは、カラムなし・既定の加工・はがきの用紙で始まる", () => {
    const template = createTemplate();
    expect(template.schema.fields).toEqual([]);
    expect(template.transform.code).toContain("return");
    expect(template.layout.css).toContain("100mm 148mm");
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
