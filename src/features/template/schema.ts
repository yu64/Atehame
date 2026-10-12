// #############################################################################
// MARK: 型定義

export type FieldType = "string" | "number" | "boolean" | "datetime";

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

// #############################################################################
// MARK: 定数

/** データ型の表示名。記述順を選択肢の表示順として扱う。 */
export const fieldTypeLabels: Record<FieldType, { name: string; english: string }> = {
  string: { name: "文字列", english: "String" },
  number: { name: "数値", english: "Number" },
  boolean: { name: "真偽値", english: "Boolean" },
  datetime: { name: "日時", english: "DateTime" },
};

// #############################################################################
// MARK: 関数

/** 新しいカラム（名前は空、文字列型）。 */
export function createSchemaField(): SchemaField {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    memo: "",
  };
}
