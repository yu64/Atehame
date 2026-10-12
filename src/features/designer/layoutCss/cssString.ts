import { parse } from "css-tree";

// #############################################################################
// MARK: 関数

/** 文字列を CSS の文字列（"..."）として書ける形にする。改行は \A にする。 */
export function encodeCssString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r\n|\r|\n/g, "\\A ");
  return `"${escaped}"`;
}

/**
 * CSS の値として書かれた文字列（"..." / '...'）を読み、エスケープを戻す。
 * 文字列でない場合は undefined。
 */
export function decodeCssString(source: string): string | undefined {
  let value;
  try {
    value = parse(source.trim(), { context: "value" });
  } catch {
    return undefined;
  }
  if (value.type !== "Value" || value.children.size !== 1) return undefined;
  const node = value.children.first;
  return (node?.type === "String" ? node.value : undefined);
}
