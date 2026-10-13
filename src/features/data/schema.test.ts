import { classifyFields, type DataSchema, inputFields } from "@src/features/data/schema";
import { describe, expect, test } from "vitest";

/** 名前だけを指定したカラムのスキーマ。 */
function schemaOf(...names: string[]): DataSchema {
  return {
    version: 1,
    fields: names.map((name, index) => ({
      id: `f${index}`,
      name,
      type: "string",
      memo: "",
    })),
  };
}

describe("加工の input に入るカラム", () => {
  test("名前が空のカラムと、重複した名前の2つ目以降を除く", () => {
    const fields = inputFields(schemaOf("氏名", "", "住所", "氏名"));
    expect(fields.map(field => field.id)).toEqual(["f0", "f2"]);
  });

  test("名前は、前後の空白（全角も）を除いたものにする。途中の空白は残す", () => {
    const fields = inputFields(schemaOf(" 氏名 ", "　住所　", "郵便 番号"));
    expect(fields.map(field => field.name)).toEqual(["氏名", "住所", "郵便 番号"]);
  });

  test("空白だけの名前は、名前がないものとして除く", () => {
    expect(inputFields(schemaOf(" ", "　", "氏名")).map(field => field.id)).toEqual(["f2"]);
  });

  test("前後の空白だけが違う名前は、重複として2つ目以降を除く", () => {
    expect(inputFields(schemaOf("氏名", " 氏名", "氏名　")).map(field => field.id)).toEqual(["f0"]);
  });
});

describe("カラムの扱い", () => {
  test("すべてのカラムを、元の順番で、扱いを付けて返す", () => {
    const classified = classifyFields(schemaOf("氏名", " ", "氏名 ", "住所"));
    expect(classified.map(({ field, name, role }) => [field.id, name, role])).toEqual([
      ["f0", "氏名", "input"],
      ["f1", "", "unnamed"],
      ["f2", "氏名", "duplicate"],
      ["f3", "住所", "input"],
    ]);
  });

  test("元のカラムは書き換えない", () => {
    const schema = schemaOf(" 氏名 ");
    expect(classifyFields(schema)[0]?.field).toBe(schema.fields[0]);
    expect(schema.fields[0]?.name).toBe(" 氏名 ");
  });
});
