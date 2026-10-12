import type { DataSchema, FieldType } from "@src/features/data";

// #############################################################################
// MARK: 定数

const declarationTypes: Record<FieldType, string> = {
  string: "string",
  number: "number | null",
  boolean: "boolean | null",
  datetime: "string | null",
};

// #############################################################################
// MARK: 関数

/** エディターの補完用に、`input` の型宣言を生成する。 */
export function createInputDeclaration(schema: DataSchema): string {
  const names = new Set<string>();
  const members: string[] = [];

  for (const field of schema.fields) {
    if (field.name === "" || names.has(field.name)) continue;
    names.add(field.name);

    // コメント終端でJSDocが壊れないようにする。
    const memo = field.memo.replaceAll("*/", "* /");
    if (memo !== "") members.push(`  /** ${memo} */`);
    members.push(`  readonly ${JSON.stringify(field.name)}: ${declarationTypes[field.type]};`);
  }

  return [
    "/** CSVの1行。スキーマのカラム名から値を引く。空欄は文字列以外では null。 */",
    "declare const input: {",
    ...members,
    "};",
  ].join("\n");
}
