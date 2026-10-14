import {
  addElementRule,
  decodeCssString,
  duplicateElementRule,
  encodeCssString,
  imageNameOf,
  moveElementRule,
  parseLayoutCss,
  parseTextTemplate,
  readPageSize,
  removeElementRule,
  renameElement,
  setDeclaration,
  templateFields,
  textTemplateOf,
} from "@src/features/designer/layoutCss";
import { describe, expect, test } from "vitest";

const sample = `@page { size: 100mm 148mm; }

/* 宛名 */
[data-name="氏名"] {
  --atehame-text: "{氏名} 様";
  left: 40mm; /* 位置 */
  top: 30mm;
  font-size: 26pt !important
}

[data-name="氏名"]::after { content: "x" }
.a, [data-name="b"] { color: red }
[data-name="c"].x { color: red }
@media print { [data-name="d"] { color: red } }
[data-name='住所'] { left: 10mm }
[data-name="氏名"] { color: blue }
`;

describe("CSS の文字列", () => {
  test.each([["山田"], ['"引用" と \\ 記号'], ["1行目\n2行目"]])("%s を往復できる", value => {
    expect(decodeCssString(encodeCssString(value))).toBe(value);
  });

  test("文字列でないものは読まない", () => {
    expect(decodeCssString("red")).toBeUndefined();
    expect(decodeCssString('"a" "b"')).toBeUndefined();
  });
});
describe("埋め込み", () => {
  test("{名前} を値の名前として読む", () => {
    expect(parseTextTemplate("〒{郵便番号} {氏名} 様")).toEqual([
      {
        kind: "text",
        text: "〒",
      },
      {
        kind: "field",
        key: "郵便番号",
      },
      {
        kind: "text",
        text: " ",
      },
      {
        kind: "field",
        key: "氏名",
      },
      {
        kind: "text",
        text: " 様",
      },
    ]);
  });

  test("{{ と }} は波括弧そのもの、閉じていない { は文字", () => {
    expect(parseTextTemplate("{{a}} {b")).toEqual([
      {
        kind: "text",
        text: "{a} {b",
      },
    ]);
    expect(parseTextTemplate("{}")).toEqual([
      {
        kind: "text",
        text: "{}",
      },
    ]);
  });

  test("値の名前の一覧", () => {
    expect(templateFields("{a}{b}{a}")).toEqual(["a", "b"]);
  });
});
describe("部品が表示するもの", () => {
  /** CSS の最初の部品。 */
  function first(css: string) {
    return parseLayoutCss(css).elements[0];
  }

  test("文字のひな形は、--atehame-text の文字列。書かれていなければ空", () => {
    expect(textTemplateOf(first(sample))).toBe("{氏名} 様");
    expect(textTemplateOf(first('[data-name="a"] { left: 1mm; }'))).toBe("");
  });

  test("画像の名前は、--atehame-image の文字列。画像の部品でなければ undefined", () => {
    expect(imageNameOf(first('[data-name="a"] { --atehame-image: "ロゴ"; }'))).toBe("ロゴ");
    expect(imageNameOf(first(sample))).toBeUndefined();
  });

  test("文字列として読めない値は、空として扱う（画像の部品ではある）", () => {
    expect(imageNameOf(first('[data-name="a"] { --atehame-image: logo; }'))).toBe("");
    expect(textTemplateOf(first('[data-name="a"] { --atehame-text: red; }'))).toBe("");
  });
});

describe("解析", () => {
  test("最上位の [data-name] だけの規則を、記述順に部品とみなす", () => {
    const layout = parseLayoutCss(sample);
    expect(layout.elements.map(element => element.name)).toEqual(["氏名", "住所"]);
  });

  test("同じ名前の規則が複数あれば最初のものを定義とする", () => {
    const element = parseLayoutCss(sample).elements[0];
    expect(element.declarations.get("color")).toBeUndefined();
    expect(element.declarations.get("left")?.value).toBe("40mm");
  });

  test("宣言の値と !important を読む", () => {
    const element = parseLayoutCss(sample).elements[0];
    expect(element.declarations.get("--atehame-text")?.value).toBe('"{氏名} 様"');
    expect(element.declarations.get("font-size")).toMatchObject({
      value: "26pt",
      important: true,
    });
  });

  test("書きかけの CSS でも読める範囲は読む", () => {
    const layout = parseLayoutCss('[data-name="a"] { left: 1mm } [data-name="b"] { top: ');
    expect(layout.elements.map(element => element.name)).toContain("a");
  });

  test.each([
    [
      "100mm 148mm",
      {
        width: 100,
        height: 148,
      },
    ],
    [
      "10cm",
      {
        width: 100,
        height: 100,
      },
    ],
    [
      "A4",
      {
        width: 210,
        height: 297,
      },
    ],
    [
      "A4 landscape",
      {
        width: 297,
        height: 210,
      },
    ],
    [
      "148mm 100mm portrait",
      {
        width: 100,
        height: 148,
      },
    ],
  ])("@page { size: %s }", (size, expected) => {
    expect(readPageSize(parseLayoutCss(`@page { size: ${size} }`))).toEqual(expected);
  });

  test("用紙サイズがなければ undefined", () => {
    expect(readPageSize(parseLayoutCss("@page { margin: 0 }"))).toBeUndefined();
    expect(readPageSize(parseLayoutCss(""))).toBeUndefined();
  });
});
describe("書き換え", () => {
  test("値だけを置き換え、コメントや !important は残す", () => {
    let css = setDeclaration(sample, { element: "氏名" }, "left", "42mm");
    css = setDeclaration(css, { element: "氏名" }, "font-size", "20pt");
    expect(css).toContain("left: 42mm; /* 位置 */");
    expect(css).toContain("font-size: 20pt !important");
    expect(css.replace(/42mm/, "40mm").replace("20pt", "26pt")).toBe(sample);
  });

  test("ない宣言は規則の末尾に追加する（; がなければ補う）", () => {
    const css = setDeclaration(sample, { element: "氏名" }, "width", "20mm");
    expect(css).toContain("font-size: 26pt !important;\n  width: 20mm;\n}");
    expect(parseLayoutCss(css).elements[0].declarations.get("width")?.value).toBe("20mm");
  });

  test("空の規則に追加する", () => {
    expect(setDeclaration('[data-name="a"] {}', { element: "a" }, "top", "1mm")).toBe(
      '[data-name="a"] {\n  top: 1mm;\n}',
    );
  });

  test("宣言を行ごと取り除く", () => {
    const css = setDeclaration(sample, { element: "氏名" }, "top", undefined);
    expect(css).not.toContain("top: 30mm");
    expect(css).toContain("left: 40mm; /* 位置 */\n  font-size");
  });

  test("@page がなければ先頭に作る", () => {
    const css = setDeclaration('[data-name="a"] {}', { page: true }, "size", "120mm 235mm");
    expect(readPageSize(parseLayoutCss(css))).toEqual({
      width: 120,
      height: 235,
    });
  });

  test("部品の規則を追加・削除する（入れ子も規則の中に書く）", () => {
    let css = addElementRule(
      ".x { color: red }",
      "差出人",
      [["--atehame-text", '"佐藤"']],
      "& > a {}",
    );
    expect(css).toBe(
      '.x { color: red }\n\n[data-name="差出人"] {\n  --atehame-text: "佐藤";\n\n  & > a {}\n}\n',
    );
    css = removeElementRule(css, "差出人");
    expect(css).toBe(".x { color: red }\n");
  });

  test("入れ子の規則があれば、宣言はその前に追加する", () => {
    const source = '[data-name="a"] {\n  left: 1mm;\n\n  & > b {\n    color: red;\n  }\n}';
    const css = setDeclaration(source, { element: "a" }, "top", "2mm");
    expect(css).toBe(
      '[data-name="a"] {\n  left: 1mm;\n  top: 2mm;\n\n  & > b {\n    color: red;\n  }\n}',
    );
    expect(parseLayoutCss(css).elements[0].declarations.get("top")?.value).toBe("2mm");
    // 宣言がなく入れ子だけの規則
    expect(setDeclaration('[data-name="a"] {\n  & b {}\n}', { element: "a" }, "top", "2mm")).toBe(
      '[data-name="a"] {\n  top: 2mm;\n  & b {}\n}',
    );
  });

  test("部品を取り除くと、その部品だけを指定する規則と直前のコメントも取り除く", () => {
    const source = [
      '[data-name="a"] { left: 1mm; }',
      '/* a の中身 */\n[data-name="a"] > [data-part="char"] { width: 5mm; }',
      '[data-name="b"] { left: 2mm; }',
      '[data-name="a"], [data-name="b"] { color: red; }',
      '[data-name="b"], [data-name="a"] { color: blue; }',
      '@media print {\n  [data-name="a"] { color: black; }\n}',
      '@media screen {\n  [data-name="a"] { color: gray; }\n  [data-name="b"] { color: gray; }\n}',
      '[data-name="b"]:not([data-name="a"]) { top: 0; }',
      "@page { size: 100mm 148mm; }",
    ].join("\n\n");
    const css = removeElementRule(source, "a");
    expect(css).toBe(
      [
        '[data-name="b"] { left: 2mm; }',
        '[data-name="b"] { color: red; }',
        '[data-name="b"] { color: blue; }',
        '@media screen {\n  [data-name="b"] { color: gray; }\n}',
        '[data-name="b"]:not([data-name="a"]) { top: 0; }',
        "@page { size: 100mm 148mm; }",
      ].join("\n\n"),
    );
  });

  test("重なり順を変えても、部品を指定するほかの規則は残す", () => {
    const source =
      '[data-name="a"] { left: 1mm; }\n\n[data-name="a"] b { x: 1; }\n\n[data-name="b"] {}';
    const css = moveElementRule(source, "a", "front");
    expect(parseLayoutCss(css).elements.map(element => element.name)).toEqual(["b", "a"]);
    expect(css).toContain('[data-name="a"] b { x: 1; }');
  });

  test("名前を変えると、その名前を指定するすべてのセレクタを書き換える", () => {
    const css = renameElement(sample, "氏名", "宛名");
    expect(css).not.toContain('"氏名"]');
    expect(css).toContain('[data-name="宛名"]::after');
    expect(css).toContain('--atehame-text: "{氏名} 様"');
    expect(parseLayoutCss(css).elements.map(element => element.name)).toEqual(["宛名", "住所"]);
  });

  test("複製は直後に作り、位置を変える", () => {
    const css = duplicateElementRule(sample, "氏名", "氏名 2", {
      left: 43,
      top: 33,
    });
    const elements = parseLayoutCss(css).elements;
    expect(elements.map(element => element.name)).toEqual(["氏名", "氏名 2", "住所"]);
    expect(elements[1].declarations.get("left")?.value).toBe("43mm");
    expect(elements[1].declarations.get("--atehame-text")?.value).toBe('"{氏名} 様"');
  });

  test("重なり順を変える", () => {
    const front = moveElementRule(sample, "氏名", "front");
    expect(parseLayoutCss(front).elements.map(element => element.name)).toEqual(["住所", "氏名"]);
    const back = moveElementRule(front, "氏名", "back");
    expect(parseLayoutCss(back).elements.map(element => element.name)).toEqual(["氏名", "住所"]);
  });
});
