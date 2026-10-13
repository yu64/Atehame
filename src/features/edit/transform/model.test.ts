import type { DataSchema, FieldType } from "@src/features/data";
import { createInputDeclaration } from "@src/features/edit/transform/model";
import { describe, expect, test } from "vitest";

/** 名前・型・メモを指定したカラムのスキーマ。 */
function schemaOf(...fields: [name: string, type?: FieldType, memo?: string][]): DataSchema {
  return {
    version: 1,
    fields: fields.map(([name, type = "string", memo = ""], index) => ({
      id: `f${index}`,
      name,
      type,
      memo,
    })),
  };
}

/** 宣言を行ごとに分ける。 */
function linesOf(declaration: string): string[] {
  return declaration.split(String.fromCharCode(10));
}

const heading = "/** CSVの1行。スキーマのカラム名から値を引く。空欄は文字列以外では null。 */";

describe("input の型宣言", () => {
  test("カラムごとに、型に合わせたメンバーを作る。文字列以外は null もありうる", () => {
    const declaration = createInputDeclaration(
      schemaOf(["氏名"], ["年齢", "number"], ["会員", "boolean"], ["登録日", "datetime"]),
    );
    expect(linesOf(declaration)).toEqual([
      heading,
      "declare const input: {",
      '  readonly "氏名": string;',
      '  readonly "年齢": number | null;',
      '  readonly "会員": boolean | null;',
      '  readonly "登録日": string | null;',
      "};",
    ]);
  });

  test("メモがあれば、説明として付ける。コメントの終わりの記号は崩す", () => {
    const declaration = createInputDeclaration(schemaOf(["氏名", "string", "敬称なし */ x /*"]));
    expect(declaration).toContain("  /** 敬称なし * / x /* */");
    // コメントの終わりは、見出しとメモの2つだけ。
    expect(declaration.split("*/")).toHaveLength(3);
  });

  test("名前は文字列として書く（引用符が入っても宣言を壊さない）", () => {
    const declaration = createInputDeclaration(schemaOf(['a"b'], ["c d"]));
    expect(declaration).toContain(`  readonly ${JSON.stringify('a"b')}: string;`);
    expect(declaration).toContain('  readonly "c d": string;');
    expect(linesOf(declaration)).toHaveLength(5);
  });

  test("input に入らないカラム（名前なし・重複）は書かず、名前は前後の空白を除く", () => {
    const declaration = createInputDeclaration(schemaOf([" 氏名 "], [""], ["氏名"]));
    expect(linesOf(declaration)).toEqual([
      heading,
      "declare const input: {",
      '  readonly "氏名": string;',
      "};",
    ]);
  });

  test("カラムがなければ、空のオブジェクト", () => {
    expect(linesOf(createInputDeclaration(schemaOf()))).toEqual([
      heading,
      "declare const input: {",
      "};",
    ]);
  });
});
