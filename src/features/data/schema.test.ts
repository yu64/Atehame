import { type DataSchema, inputFields } from "@src/features/data/schema";
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
});
