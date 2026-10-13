import type { DataSchema, FieldType } from "@src/features/data/schema";
import type { JsonValue } from "@src/shared/lib/json";

// #############################################################################
// MARK: 型定義

/** CSVの1行。フィールドIDからセルの文字列を引く。 */
export type RowCells = Record<string, string>;

/** 加工処理の `input` に渡す値。カラム名から型変換済みの値を引く。 */
export interface TransformInput {
  [name: string]: JsonValue;
}

export interface InputProblem {
  /** schema: カラムの定義の問題（どの行でも同じ）。value: その行の値の問題（型に合わないなど）。 */
  kind: "schema" | "value";
  /** 対象のフィールド。スキーマ全体の問題では undefined。 */
  fieldId?: string;
  message: string;
}

export interface InputConversion {
  input: TransformInput;
  problems: InputProblem[];
}

// #############################################################################
// MARK: 関数

/** セルの文字列をスキーマの型へ変換する。空欄は文字列以外では null とする。 */
export function convertCell(
  type: FieldType,
  text: string,
): { value: JsonValue } | { error: string } {
  const trimmed = text.trim();
  if (type === "string") return { value: text };
  if (trimmed === "") return { value: null };

  switch (type) {
    case "number": {
      const value = Number(trimmed);
      return (
        (Number.isFinite(value))
        ? { value }
        : { error: "数値ではありません。" }
      );
    }
    case "boolean": {
      const normalized = trimmed.toLowerCase();
      if (normalized === "true" || normalized === "1") return { value: true };
      if (normalized === "false" || normalized === "0") return { value: false };
      return { error: "true / false / 1 / 0 のいずれかにしてください。" };
    }
    case "datetime":
      // 日時は書式を加工処理側で扱えるよう、文字列のまま渡す。
      return { value: trimmed };
  }
}

/** スキーマに従ってCSVの1行を `input` に変換する。 */
export function createTransformInput(schema: DataSchema, cells: RowCells): InputConversion {
  const input: TransformInput = {};
  const problems: InputProblem[] = [];
  const names = new Set<string>();

  for (const field of schema.fields) {
    if (field.name === "") {
      problems.push({
        kind: "schema",
        fieldId: field.id,
        message: "カラム名が空のため、input に含まれません。",
      });
      continue;
    }
    if (names.has(field.name)) {
      problems.push({
        kind: "schema",
        fieldId: field.id,
        message: `カラム名「${field.name}」が重複しています。`,
      });
      continue;
    }
    names.add(field.name);

    const converted = convertCell(field.type, cells[field.id] ?? "");
    if ("error" in converted) {
      problems.push({
        kind: "value",
        fieldId: field.id,
        message: converted.error,
      });
      input[field.name] = null;
    } else {
      input[field.name] = converted.value;
    }
  }

  return {
    input,
    problems,
  };
}
