// @vitest-environment happy-dom
import { sanitizeSvg } from "@src/shared/lib/sanitizeSvg";
import { describe, expect, test } from "vitest";

describe("SVG の安全化", () => {
  test("スクリプト・イベント属性・外部への参照を取り除き、図形は残す", () => {
    const svg = sanitizeSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" onload="alert(1)">
        <script>alert(1)</script>
        <foreignObject><div>html</div></foreignObject>
        <style>@import url(https://example.com/a.css); .a { fill: url(https://example.com/x); }</style>
        <defs><linearGradient id="g"/></defs>
        <rect id="r" width="10" height="10" fill="url(#g)" onclick="alert(1)"/>
        <use xlink:href="#r"/>
        <image href="https://example.com/x.png"/>
        <a href="javascript:alert(1)"><circle r="1"/></a>
        <set attributeName="href" to="javascript:alert(1)"/>
      </svg>`,
    )!;
    expect(svg).toBeDefined();
    for (const blocked of [
      "<script",
      "foreignObject",
      "onload",
      "onclick",
      "@import",
      "example.com",
      "javascript:",
      "<set",
    ]) {
      expect(svg).not.toContain(blocked);
    }
    expect(svg).toContain('<rect id="r"');
    expect(svg).toContain('fill="url(#g)"');
    expect(svg).toContain('href="#r"');
  });

  test("SVG として読めなければ undefined", () => {
    expect(sanitizeSvg("<html></html>")).toBeUndefined();
    expect(sanitizeSvg("not xml")).toBeUndefined();
  });
});
