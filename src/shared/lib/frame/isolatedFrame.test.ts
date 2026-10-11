// @vitest-environment happy-dom
import {
  createIsolatedFrameHtml,
  isolatedFrameCsp,
  setStyleText,
} from "@src/shared/lib/frame/isolatedFrame";
import { describe, expect, test } from "vitest";

describe("外部と切り離した iframe の文書", () => {
  test("外部への通信を禁止する CSP を持ち、スクリプトを含まない", () => {
    const html = createIsolatedFrameHtml({ styles: [{ id: "base", css: "p { color: red }" }] });
    expect(html).toContain(`content="${isolatedFrameCsp}"`);
    expect(isolatedFrameCsp).toContain("default-src 'none'");
    expect(html).toContain('<style id="base">p { color: red }</style>');
    expect(html).not.toContain("<script");
  });

  test("style の中身は文字列として入れ、HTML としては解釈しない", () => {
    const doc = document.implementation.createHTMLDocument("frame");
    setStyleText(doc, "author", "</style><script>alert(1)</script>");
    const style = doc.getElementById("author");
    expect(style?.textContent).toBe("</style><script>alert(1)</script>");
    expect(doc.querySelector("script")).toBeNull();
  });
});
