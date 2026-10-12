import { parseTemplateFile, serializeTemplateFile, toTemplateFile } from "@src/features/data";
import { layoutSchema } from "@src/features/designer";
import { standardTemplates } from "@src/features/use/standard/templates";
import { describe, expect, test } from "vitest";

describe("標準のテンプレート", () => {
  test.each(standardTemplates.map(standard => [standard.title, standard] as const))(
    "%s は、保存して読み込める正しいテンプレート",
    (_, standard) => {
      const template = standard.create();
      expect(layoutSchema.safeParse(template.layout).success).toBe(true);
      expect(parseTemplateFile(serializeTemplateFile(toTemplateFile(template))).ok).toBe(true);
    },
  );
});
