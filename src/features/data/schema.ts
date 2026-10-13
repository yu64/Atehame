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

/** カラムの扱い。input は加工の input に入る。unnamed は名前がない。duplicate は同じ名前の2つ目以降。 */
export type FieldRole = "input" | "unnamed" | "duplicate";

export interface ClassifiedField {
  field: SchemaField;
  /** 前後の空白を除いたカラム名。input のキーと、CSV の見出しとの対応に使う。 */
  name: string;
  role: FieldRole;
}

// #############################################################################
// MARK: 定数

/** データ型の表示名。記述順を選択肢の表示順として扱う。 */
export const fieldTypeLabels: Record<FieldType, { name: string; english: string }> = {
  string: {
    name: "文字列",
    english: "String",
  },
  number: {
    name: "数値",
    english: "Number",
  },
  boolean: {
    name: "真偽値",
    english: "Boolean",
  },
  datetime: {
    name: "日時",
    english: "DateTime",
  },
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

/**
 * カラム名と、CSV の見出しを、比べられる形にそろえる。前後の空白（全角の空白も）を除く。
 * 入力のときに紛れた空白で、対応が外れないようにするため。名前の途中の空白は、そのまま残す。
 */
export function normalizeFieldName(name: string): string {
  return name.trim();
}

/**
 * 各カラムの扱いを決める。カラム名に関わる規則（どれが input に入るか）は、ここだけに書く。
 * カラム名は normalizeFieldName でそろえてから比べる。
 */
export function classifyFields(schema: DataSchema): ClassifiedField[] {
  const seen = new Set<string>();
  return schema.fields.map(field => {
    const name = normalizeFieldName(field.name);
    const role = (name === "" ? "unnamed" : (seen.has(name) ? "duplicate" : "input"));
    seen.add(name);
    return {
      field,
      name,
      role,
    };
  });
}

/**
 * 加工の input に入るカラム（名前があり、同じ名前の2つ目以降でないもの）。名前は、前後の空白を除いたもの。
 * 名前が空のカラムと、重複した名前のカラムは input に入らないため、CSV の対応や一覧の表示からも除く。
 */
export function inputFields(schema: DataSchema): SchemaField[] {
  return classifyFields(schema)
    .filter(classified => classified.role === "input")
    .map(({ field, name }) => ({
      ...field,
      name,
    }));
}
