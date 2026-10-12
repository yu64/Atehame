import {
  base64ByteLength,
  base64ToBytes,
  bytesToBase64,
  detectImageType,
  isBase64,
} from "@src/shared/lib/imageFile";
import { describe, expect, test } from "vitest";

/** 文字列を UTF-8 のバイト列にする。 */
function text(value: string) {
  return new TextEncoder().encode(value);
}

describe("画像の形式の判定", () => {
  test.each([
    ["PNG", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0], "image/png"],
    ["JPEG", [0xff, 0xd8, 0xff, 0xe0, 0, 0], "image/jpeg"],
    ["WebP", [...text("RIFF"), 0, 0, 0, 0, ...text("WEBP")], "image/webp"],
  ])("%s は先頭のバイトで判定する", (_, bytes, expected) => {
    expect(detectImageType(new Uint8Array(bytes as number[]))).toBe(expected);
  });

  test("SVG は XML 宣言やコメントの後の <svg で判定する", () => {
    expect(detectImageType(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe(
      "image/svg+xml",
    );
    expect(
      detectImageType(text('﻿<?xml version="1.0"?>\n<!-- logo -->\n<svg viewBox="0 0 1 1"/>')),
    ).toBe("image/svg+xml");
  });

  test("画像でなければ undefined。拡張子は見ない", () => {
    expect(detectImageType(text("<html><svg></svg></html>"))).toBeUndefined();
    expect(detectImageType(text("GIF89a"))).toBeUndefined();
  });
});

describe("base64", () => {
  test("バイト列と相互に変換し、元のバイト数を求める", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251]);
    const base64 = bytesToBase64(bytes);
    expect([...base64ToBytes(base64)]).toEqual([...bytes]);
    expect(base64ByteLength(base64)).toBe(5);
    expect(isBase64(base64)).toBe(true);
    expect(isBase64("abc")).toBe(false);
    expect(isBase64("ab c")).toBe(false);
  });
});
