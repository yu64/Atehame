export type FieldType = (
  | "string"
  | "number"
  | "boolean"
  | "datetime"
);

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
