import { normalizeName, sanitizeCss } from "@src/features/designer/render/sanitizeCss";
import { describe, expect, test } from "vitest";

/** テストで使う上限。 */
const maxLength = 100_000;

describe("sanitizeCss", () => {
  test("通常の記述は残す", () => {
    const { css, warnings } = sanitizeCss(
      '[data-name="氏名"] { letter-spacing: 0.2em; color: #333 } @media print { .a { color: red } }',
      maxLength,
    );
    expect(warnings).toEqual([]);
    expect(css).toContain("letter-spacing:0.2em");
    expect(css).toContain("@media print");
  });

  test.each([
    ["@import", '@import url("https://example.com/a.css"); .a { color: red }'],
    ["@import（文字列）", '@import "https://example.com/a.css";'],
    ["@font-face", '@font-face { font-family: x; src: url("https://example.com/f.woff2") }'],
    ["@namespace", '@namespace svg url("http://www.w3.org/2000/svg");'],
  ])("%s を取り除く", (_, source) => {
    const { css, warnings } = sanitizeCss(source, maxLength);
    expect(css).not.toMatch(/@import|@font-face|@namespace|example\.com/);
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("入れ子の規則は残し、中の危険な記述は取り除く", () => {
    const result = sanitizeCss(
      '[data-name="a"] { left: 1mm; & > [data-part="char"] { width: 5mm; background: url(x) } }',
      maxLength,
    );
    expect(result.css).toContain('&>[data-part="char"]{width:5mm}');
    expect(result.css).not.toContain("url");
  });

  test("@page は size と margin だけを残す", () => {
    const { css, warnings } = sanitizeCss(
      '@page { size: 100mm 148mm; margin: 0; background: url("https://example.com/p.png"); @top-left { content: "x" } }',
      maxLength,
    );
    expect(css).toBe("@page{size:100mm 148mm;margin:0}");
    expect(warnings).toContain("@page では size と margin だけが使えます。");
  });

  test("部品のカスタムプロパティは残す", () => {
    const { css, warnings } = sanitizeCss(
      '[data-name="a"] { --atehame-text: "{氏名} 様"; --atehame-split: char }',
      maxLength,
    );
    expect(warnings).toEqual([]);
    expect(css).toContain('--atehame-text:"{氏名} 様"');
    expect(css).toContain("--atehame-split:char");
  });

  test.each([
    ["url()", '.a { background: url("https://example.com/leak?x") }'],
    ["引用符なしの url()", ".a { background-image: url(https://example.com/leak) }"],
    ["image-set()", '.a { background: image-set("https://example.com/a.png" 1x) }'],
    [
      "属性セレクタと url()",
      '[data-key="氏名"][data-name^="山"] { background: url(//example.com/y) }',
    ],
    ["@media の中", "@media print { .a { list-style-image: url(https://example.com/i) } }"],
    ["カスタムプロパティ", ":root { --x: url(https://example.com/v) } .a { background: var(--x) }"],
    ["エスケープした url", ".a { background: u\\72 l(https://example.com/escaped) }"],
    [
      "エスケープした image-set",
      '.a { background: \\69 mage-set("https://example.com/e.png" 1x) }',
    ],
  ])("%s を含む宣言を取り除く", (_, source) => {
    const { css, warnings } = sanitizeCss(source, maxLength);
    expect(css).not.toContain("example.com");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("壊れた記述は取り除き、残りは使う", () => {
    const { css } = sanitizeCss(".a { color: red; } } .b { color: blue }", maxLength);
    expect(css).toContain("color:red");
  });

  test("渡した上限より長い CSS は使わない。上限ちょうどまでは使う", () => {
    const source = ".a{color:red}";
    const over = sanitizeCss(source, source.length - 1);
    expect(over.css).toBe("");
    expect(over.warnings).toEqual([`CSS が長すぎます（${source.length - 1} 文字まで）。`]);

    const within = sanitizeCss(source, source.length);
    expect(within.css).toContain("color:red");
    expect(within.warnings).toEqual([]);
  });
});
describe("normalizeName", () => {
  test.each([
    ["URL", "url"],
    ["u\\72 l", "url"],
    ["\\75rl", "url"],
    ["\\69 mage-set", "image-set"],
    ["\\i mage-set", "i mage-set"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeName(input)).toBe(expected);
  });
});
