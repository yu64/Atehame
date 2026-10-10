// @vitest-environment happy-dom
import { LayoutDocument } from "@src/logic/layoutCss";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderFrameCsp,
  renderPage,
  renderPages,
} from "@src/logic/render";
import { beforeEach, describe, expect, test } from "vitest";

let doc: Document;

beforeEach(() => {
  doc = document.implementation.createHTMLDocument("render");
});

const layout = (css: string) => LayoutDocument.from(css);

describe("描画用の文書", () => {
  test("外部への通信を禁止する CSP を持つ", () => {
    const html = createDocumentHtml();
    expect(html).toContain(`content="${renderFrameCsp}"`);
    expect(renderFrameCsp).toContain("default-src 'none'");
    expect(html).not.toContain("<script");
  });

  test("用紙の大きさと安全化した CSS を設定する", () => {
    const warnings = applyLayoutStyles(
      doc,
      layout(
        '@page { size: 120mm 235mm } @import "https://example.com/x.css"; [data-name="氏名"] { color: red }',
      ),
    );
    expect(doc.getElementById("atehame-paper")?.textContent).toContain(
      "width: 120mm; height: 235mm",
    );
    expect(doc.getElementById("atehame-author")?.textContent).toContain("color:red");
    expect(doc.getElementById("atehame-author")?.textContent).not.toContain("example.com");
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe("ページの描画", () => {
  test("[data-name] の規則ごとに、記述順に部品を作る", () => {
    const page = renderPage(
      doc,
      layout('[data-name="b"] {} .x {} [data-name="a"] {} @media print { [data-name="c"] {} }'),
      {},
    );
    expect([...page.children].map(child => (child as HTMLElement).dataset.name)).toEqual([
      "b",
      "a",
    ]);
  });

  test("{名前} に値を埋め込む", () => {
    const page = renderPage(doc, layout('[data-name="宛名"] { --atehame-text: "{氏名} 様" }'), {
      氏名: "山田 太郎",
    });
    expect(page.textContent).toBe("山田 太郎 様");
    expect(page.querySelector('[data-part="content"]')).not.toBeNull();
  });

  test("値は文字として入り、HTML として解釈されない", () => {
    const page = renderPage(doc, layout('[data-name="a"] { --atehame-text: "{x}" }'), {
      x: '<img src=x onerror="alert(1)">',
    });
    expect(page.querySelector("img")).toBeNull();
    expect(page.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  test("改行は \\A で書ける", () => {
    const page = renderPage(
      doc,
      layout('[data-name="a"] { --atehame-text: "1行目\\A 2行目" }'),
      {},
    );
    expect(page.textContent).toBe("1行目\n2行目");
  });

  test("値がない埋め込みは、デザイナーでは名前を薄く表示し、印刷では空にする", () => {
    const css = layout('[data-name="a"] { --atehame-text: "{氏名} 様" }');
    const designer = renderPage(doc, css, {}, { placeholder: true });
    expect(designer.textContent).toBe("{氏名} 様");
    expect(designer.querySelector(".atehame-placeholder")?.textContent).toBe("{氏名}");
    expect(renderPage(doc, css, {}).textContent).toBe(" 様");
  });

  test("text-combine-upright: digits で数字の並びを縦中横にする", () => {
    const page = renderPage(
      doc,
      layout('[data-name="a"] { --atehame-text: "{住所}"; text-combine-upright: digits 2 }'),
      { 住所: "1丁目23番456号" },
    );
    expect([...page.querySelectorAll(".atehame-tcy")].map(span => span.textContent)).toEqual([
      "1",
      "23",
    ]);
  });

  test("--atehame-split: char で1文字ずつ分ける", () => {
    const page = renderPage(
      doc,
      layout('[data-name="郵便番号"] { --atehame-text: "{郵便番号}"; --atehame-split: char }'),
      { 郵便番号: "1500043" },
    );
    const chars = [...page.querySelectorAll('[data-part="char"]')].map(span => span.textContent);
    expect(chars).toEqual(["1", "5", "0", "0", "0", "4", "3"]);
  });

  test("行ごとに1ページずつ組み立てる", () => {
    renderPages(doc, layout('[data-name="a"] { --atehame-text: "{x}" }'), [{ x: "A" }, { x: "B" }]);
    expect([...doc.body.querySelectorAll(".atehame-page")].map(page => page.textContent)).toEqual([
      "A",
      "B",
    ]);
  });
});
