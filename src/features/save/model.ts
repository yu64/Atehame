import { layoutSchema, type Layout } from "@src/features/designer";
import type { DataSchema } from "@src/features/schema";
import { z } from "zod";

export const templateFileFormat = "atehame-template";

/** テンプレートとして書き出すファイルの内容。スキーマ・加工・レイアウトをまとめて持つ。 */
export interface TemplateFile {
  format: typeof templateFileFormat;
  version: 1;
  name: string;
  schema: DataSchema;
  transform: { code: string };
  layout: Layout;
}

const templateFileSchema = z.object({
  format: z.literal(templateFileFormat),
  version: z.literal(1),
  name: z.string().max(200),
  schema: z.object({
    version: z.literal(1),
    fields: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          name: z.string().max(200),
          type: z.enum(["string", "number", "boolean", "datetime"]),
          memo: z.string().max(1000),
        }),
      )
      .max(500),
  }),
  transform: z.object({ code: z.string().max(64 * 1024) }),
  layout: layoutSchema,
});

export function createTemplateFile(
  name: string,
  schema: DataSchema,
  code: string,
  layout: Layout,
): TemplateFile {
  return { format: templateFileFormat, version: 1, name, schema, transform: { code }, layout };
}

export function serializeTemplateFile(file: TemplateFile): string {
  return JSON.stringify(file, null, 2);
}

export type ParseResult = { ok: true; file: TemplateFile } | { ok: false; message: string };

/** 読み込んだ JSON をテンプレートとして検証する。他人が作ったファイルも想定する。 */
export function parseTemplateFile(json: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { ok: false, message: "JSON として読み込めませんでした。" };
  }

  const result = templateFileSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "(全体)";
    return { ok: false, message: `テンプレートの形式が正しくありません（${path}）。` };
  }
  return { ok: true, file: result.data };
}

/** ファイル名に使えない文字を置き換える。 */
export function toFileName(name: string): string {
  const base = name.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_") || "template";
  return `${base}.atehame.json`;
}
