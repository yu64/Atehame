import { guessDelimiter, parseCsv, stringifyCsv } from "@src/shared/lib/csv";
import { describe, expect, test } from "vitest";

describe("CSV の解析", () => {
  test("カンマと改行で区切る（改行は CRLF・LF のどちらでもよい）", () => {
    expect(parseCsv("a,b\r\nc,d\ne,f\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
    ]);
  });

  test("ダブルクォートで囲んだセルは、カンマ・改行・ダブルクォートを含められる", () => {
    expect(parseCsv('"東京都, 千代田区","1行目\n2行目","""引用"""')).toEqual([
      ["東京都, 千代田区", "1行目\n2行目", '"引用"'],
    ]);
  });

  test("末尾に改行がなくても、最後の行を読む。空のセルも残す", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });

  test("タブ区切り（表計算ソフトからコピーした表）も読める", () => {
    const text = '氏名\t住所\r\n山田\t"東京都\n千代田区"\r\n';
    expect(guessDelimiter(text)).toBe("\t");
    expect(parseCsv(text, "\t")).toEqual([
      ["氏名", "住所"],
      ["山田", "東京都\n千代田区"],
    ]);
  });

  test("1行目にタブがなければカンマ区切りとみなす", () => {
    expect(guessDelimiter("氏名,住所\n山田\t太郎,東京都")).toBe(",");
  });

  test("書き出した CSV を読むと元に戻る", () => {
    const rows = [
      ["氏名", "住所"],
      ['山田 "太郎"', "東京都, 千代田区\n1-1"],
    ];
    expect(parseCsv(stringifyCsv(rows))).toEqual(rows);
  });
});
