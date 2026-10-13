import type { DataSchema, FieldType } from "@src/features/data/schema";
import { convertCell, createTransformInput } from "@src/features/data/transformInput";
import { describe, expect, test } from "vitest";

/** 名前と型を指定したカラムのスキーマ。ID は f0, f1, ...。 */
function schemaOf(...fields: [name: string, type?: FieldType][]): DataSchema {
  return {
    version: 1,
    fields: fields.map(([name, type = "string"], index) => ({
      id: `f${index}`,
      name,
      type,
      memo: "",
    })),
  };
}

describe("セルの型変換", () => {
  test("文字列は、空白も含めてそのまま渡す", () => {
    expect(convertCell("string", " 山田 ")).toEqual({ value: " 山田 " });
    expect(convertCell("string", "")).toEqual({ value: "" });
  });

  test("文字列以外は、空欄を null にする", () => {
    expect(convertCell("number", "")).toEqual({ value: null });
    expect(convertCell("boolean", "  ")).toEqual({ value: null });
    expect(convertCell("datetime", "")).toEqual({ value: null });
  });

  test("数値は、前後の空白を除いて読む。読めなければエラー", () => {
    expect(convertCell("number", " 12.5 ")).toEqual({ value: 12.5 });
    expect(convertCell("number", "-3")).toEqual({ value: -3 });
    expect(convertCell("number", "12円")).toEqual({ error: "数値ではありません。" });
    expect(convertCell("number", "Infinity")).toEqual({ error: "数値ではありません。" });
  });

  test("真偽値は、true / false / 1 / 0 を読む（大文字と小文字は区別しない）", () => {
    expect(convertCell("boolean", "TRUE")).toEqual({ value: true });
    expect(convertCell("boolean", "1")).toEqual({ value: true });
    expect(convertCell("boolean", "False")).toEqual({ value: false });
    expect(convertCell("boolean", "0")).toEqual({ value: false });
    expect(convertCell("boolean", "はい")).toHaveProperty("error");
  });

  test("日時は、前後の空白を除いた文字列のまま渡す", () => {
    expect(convertCell("datetime", " 2026-01-01 ")).toEqual({ value: "2026-01-01" });
  });
});

describe("CSV の1行から input を作る", () => {
  test("カラム名をキーにして、型変換した値を入れる。セルがなければ空欄として扱う", () => {
    const schema = schemaOf(["氏名"], ["年齢", "number"], ["住所"]);
    const result = createTransformInput(schema, {
      f0: "山田",
      f1: "30",
    });
    expect(result.input).toEqual({
      氏名: "山田",
      年齢: 30,
      住所: "",
    });
    expect(result.problems).toEqual([]);
  });

  test("型に合わない値は null にして、その行の問題として知らせる", () => {
    const result = createTransformInput(schemaOf(["年齢", "number"]), { f0: "三十" });
    expect(result.input).toEqual({ 年齢: null });
    expect(result.problems).toEqual([
      {
        kind: "value",
        fieldId: "f0",
        message: "数値ではありません。",
      },
    ]);
  });

  test("名前のないカラムと、重複した名前の2つ目以降は入れず、定義の問題として知らせる", () => {
    const schema = schemaOf(["氏名"], [""], ["氏名"]);
    const result = createTransformInput(schema, {
      f0: "山田",
      f1: "x",
      f2: "佐藤",
    });
    expect(result.input).toEqual({ 氏名: "山田" });
    expect(result.problems.map(problem => [problem.kind, problem.fieldId])).toEqual([
      ["schema", "f1"],
      ["schema", "f2"],
    ]);
  });

  test("キーは、前後の空白（全角も）を除いたカラム名にする", () => {
    const schema = schemaOf([" 氏名 "], ["　住所　"]);
    const result = createTransformInput(schema, {
      f0: "山田",
      f1: "東京",
    });
    expect(result.input).toEqual({
      氏名: "山田",
      住所: "東京",
    });
    expect(result.problems).toEqual([]);
  });

  test("空白だけの名前は名前がないものとして、前後の空白だけが違う名前は重複として扱う", () => {
    const schema = schemaOf(["氏名"], ["　"], ["氏名 "]);
    const result = createTransformInput(schema, {
      f0: "山田",
      f1: "x",
      f2: "佐藤",
    });
    expect(result.input).toEqual({ 氏名: "山田" });
    expect(result.problems.map(problem => problem.message)).toEqual([
      "カラム名が空のため、input に含まれません。",
      "カラム名「氏名」が重複しています。",
    ]);
  });
});
