import { createLayout, type Layout, layoutSchema } from "@src/features/designer";
import type { DataSchema } from "@src/features/template/schema";
import { z } from "zod";

// #############################################################################
// MARK: テンプレート

/**
 * テンプレート。CSV で受け取るカラム（スキーマ）・加工のコード・レイアウトをまとめて持つ。
 * 編集中はアプリでこれを1つの状態として持ち、保存するとそのままファイルになる。
 */
export interface Template {
  name: string;
  schema: DataSchema;
  transform: { code: string };
  layout: Layout;
}

export const defaultTransformCode = `// input: CSVの1行（カラム名 → 値）
// return: レイアウトに渡す値（JSONデータ）
return {
  ...input,
};
`;

/** 空のテンプレート。 */
export function createTemplate(): Template {
  return {
    name: "",
    schema: { version: 1, fields: [] },
    transform: { code: defaultTransformCode },
    layout: createLayout("hagaki"),
  };
}

// #############################################################################
// MARK: ファイルの形式

export const templateFileFormat = "atehame-template";

/** テンプレートとして書き出すファイルの内容。 */
export interface TemplateFile extends Template {
  format: typeof templateFileFormat;
  version: 1;
}

// #############################################################################
// MARK: 検証

/** テンプレートの検証。ファイルの読み込みと、自動保存した内容の読み込みで使う。 */
const templateSchema = z.object({
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

const templateFileSchema = templateSchema.extend({
  format: z.literal(templateFileFormat),
  version: z.literal(1),
});

/** テンプレートとして正しければ返す。正しくなければ undefined。 */
export function parseTemplate(value: unknown): Template | undefined {
  const result = templateSchema.safeParse(value);
  return (result.success ? result.data : undefined);
}

// #############################################################################
// MARK: ファイルとの変換

/** テンプレートを、書き出すファイルの内容にする。 */
export function toTemplateFile(template: Template): TemplateFile {
  const { name, schema, transform, layout } = template;
  return { format: templateFileFormat, version: 1, name, schema, transform, layout };
}

/** 読み込んだファイルの内容から、テンプレートを取り出す。 */
export function fromTemplateFile(file: TemplateFile): Template {
  const { name, schema, transform, layout } = file;
  return { name, schema, transform, layout };
}

/** ファイルの内容を、読みやすい JSON の文字列にする。 */
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
  // eslint-disable-next-line no-control-regex -- ファイル名に使えない制御文字を置き換えるため。
  const base = name.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_") || "template";
  return `${base}.atehame.json`;
}
