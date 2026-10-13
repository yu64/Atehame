import { acceptsFile } from "@src/shared/lib/fileAccept";
import { describe, expect, test } from "vitest";

function file(name: string, type = "") {
  return {
    name,
    type,
  };
}

describe("受け付けるファイルの種類", () => {
  test("accept が空なら、すべて受け付ける", () => {
    expect(acceptsFile(undefined, file("a.pdf", "application/pdf"))).toBe(true);
    expect(acceptsFile("", file("a.pdf"))).toBe(true);
    expect(acceptsFile(" , ", file("a.pdf"))).toBe(true);
  });

  test("拡張子は、名前の終わりで比べる（大文字と小文字は区別しない）", () => {
    expect(acceptsFile(".csv,.tsv", file("住所録.CSV"))).toBe(true);
    expect(acceptsFile(".json", file("年賀状.atehame.json"))).toBe(true);
    expect(acceptsFile(".csv", file("csv"))).toBe(false);
    expect(acceptsFile(".csv", file("a.csv.pdf"))).toBe(false);
  });

  test("種類は、同じものだけ受け付ける", () => {
    expect(acceptsFile("image/png, image/jpeg", file("a", "image/jpeg"))).toBe(true);
    expect(acceptsFile("image/png", file("a", "IMAGE/PNG"))).toBe(true);
    expect(acceptsFile("image/png", file("a", "image/gif"))).toBe(false);
  });

  test("「image/*」は、種類の前半で比べる", () => {
    expect(acceptsFile("image/*", file("a", "image/webp"))).toBe(true);
    expect(acceptsFile("image/*", file("a", "text/plain"))).toBe(false);
    expect(acceptsFile("image/*", file("image.txt"))).toBe(false);
  });

  test("種類が分からなくても、拡張子が合えば受け付ける", () => {
    expect(acceptsFile(".csv,text/csv", file("a.csv", "application/vnd.ms-excel"))).toBe(true);
    expect(acceptsFile(".csv,text/csv", file("a.xlsx", "application/vnd.ms-excel"))).toBe(false);
  });
});
