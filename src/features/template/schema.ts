export type FieldType = "string" | "number" | "boolean" | "datetime";

/** データ型の表示名。記述順を選択肢の表示順として扱う。 */
export const fieldTypeLabels: Record<FieldType, { name: string; english: string }> = {
  string: { name: "文字列", english: "String" },
  number: { name: "数値", english: "Number" },
  boolean: { name: "真偽値", english: "Boolean" },
  datetime: { name: "日時", english: "DateTime" },
};

export interface SchemaField {
  /** 内部識別子 */
  id: string;
  /** フィールド名 */
  name: string;
  /** データ型 */
  type: FieldType;
  /** コメント */
  memo: string;
}

export interface DataSchema {
  version: 1;
  /** 配列の順番を表示順として扱う */
  fields: SchemaField[];
}

export function createSchemaField(): SchemaField {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    memo: "",
  };
}
