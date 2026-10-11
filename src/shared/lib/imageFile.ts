/** 扱える画像の形式。 */
export type ImageType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export const imageTypes: readonly ImageType[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

/**
 * 中身から画像の形式を判定する。拡張子やファイルの種類の申告は信用しない。
 * PNG・JPEG・WebP は先頭のバイト、SVG は先頭の文字列で判定する。
 */
export function detectImageType(bytes: Uint8Array): ImageType | undefined {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return "image/webp";
  }
  // SVG は XML 宣言・コメント・DOCTYPE の後に <svg が来る。
  const head = new TextDecoder().decode(bytes.slice(0, 1024)).replace(/^\uFEFF/, "");
  const withoutProlog = head.replace(
    /^(\s*(<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>))*/i,
    "",
  );
  if (/^\s*<svg[\s>]/i.test(withoutProlog)) return "image/svg+xml";
  return undefined;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  // 大きな配列を一度に渡すと引数の数の上限を超えるため、分けて変換する。
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** base64 として正しい文字列か（空白や改行は含めない）。 */
export function isBase64(value: string): boolean {
  return value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}

/** base64 の文字列が表すバイト数。 */
export function base64ByteLength(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

export interface ImageFile {
  type: ImageType;
  bytes: Uint8Array;
}

/** ファイルを読み、画像の形式を判定する。画像でなければ undefined。 */
export async function readImageFile(file: Blob): Promise<ImageFile | undefined> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  return type ? { type, bytes } : undefined;
}
