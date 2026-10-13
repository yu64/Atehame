import { createCsvTemplate, readCsvTable } from "@src/features/data/csvTable";
import type { DataSchema } from "@src/features/data/schema";
import { describe, expect, test } from "vitest";

const schema: DataSchema = {
  version: 1,
  fields: [
    {
      id: "a",
      name: "郵便番号",
      type: "string",
      memo: "",
    },
    {
      id: "b",
      name: "氏名",
      type: "string",
      memo: "",
    },
    {
      id: "c",
      name: "",
      type: "string",
      memo: "",
    },
  ],
};

describe("CSV の表とスキーマの対応", () => {
  test("見出しの名前でカラムに対応させる。列の順番は問わず、空の行は除く", () => {
    const table = readCsvTable(schema, [
      ["氏名", "郵便番号", "メモ"],
      ["山田", "100-0001", "x"],
      ["", "", ""],
      ["佐藤", "200-0002"],
    ]);
    expect(table.rows).toEqual([
      {
        a: "100-0001",
        b: "山田",
      },
      {
        a: "200-0002",
        b: "佐藤",
      },
    ]);
    expect(table.missing).toEqual([]);
    expect(table.extra).toEqual(["メモ"]);
  });

  test("見出しにないカラムを知らせる（名前が空のカラムは対象外）", () => {
    const table = readCsvTable(schema, [["氏名"], ["山田"]]);
    expect(table.missing).toEqual(["郵便番号"]);
    expect(table.rows).toEqual([{ b: "山田" }]);
  });

  test("カラム名と見出しは、どちらも前後の空白を除いて比べる", () => {
    const spaced: DataSchema = {
      version: 1,
      fields: [
        {
          id: "a",
          name: " 郵便番号",
          type: "string",
          memo: "",
        },
        {
          id: "b",
          name: "氏名　",
          type: "string",
          memo: "",
        },
      ],
    };
    const table = readCsvTable(spaced, [
      ["郵便番号 ", "　氏名"],
      ["100-0001", "山田"],
    ]);
    expect(table.rows).toEqual([
      {
        a: "100-0001",
        b: "山田",
      },
    ]);
    expect(table.missing).toEqual([]);
    expect(table.extra).toEqual([]);
    expect(createCsvTemplate(spaced)).toContain("郵便番号,氏名");
  });

  test("ひな形は、名前のあるカラムを見出しにした CSV（BOM 付き）", () => {
    expect(createCsvTemplate(schema)).toBe("\uFEFF郵便番号,氏名\r\n");
  });
});
