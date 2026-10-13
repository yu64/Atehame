import { parseTemplateFile } from "@src/features/data/model";
import { standardTemplates } from "@src/features/data/standard/standardTemplates";
import { readdirSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { describe, expect, test } from "vitest";

// テストでは URL を fetch できないため、ファイルを直接読む。
const templatesDir = new URL("./templates/", import.meta.url);
const fileNames = readdirSync(templatesDir).filter(name => name.endsWith(".atehame.json"));

describe("標準のテンプレート", () => {
  test.each(fileNames)("%s は、正しいテンプレートのファイル", fileName => {
    const result = parseTemplateFile(readFileSync(new URL(fileName, templatesDir), "utf8"));
    expect(result.ok ? undefined : result.message).toBeUndefined();
  });

  test("templates のファイルは、すべて一覧にある", () => {
    const listed = standardTemplates.map(standard => basename(standard.url).split("?")[0]);
    expect([...listed].sort()).toEqual([...fileNames].sort());
  });

  test("一覧の id は重ならない", () => {
    const ids = standardTemplates.map(standard => standard.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
