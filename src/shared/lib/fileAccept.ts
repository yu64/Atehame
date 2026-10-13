/**
 * ファイルが、受け付ける種類（input の accept と同じ書き方）に当てはまるか。
 * 「.csv」は名前の終わり、「image/png」は種類、「image/*」は種類の前半で比べる。大文字と小文字は区別しない。
 * accept が空なら、すべて受け付ける。
 */
export function acceptsFile(
  accept: string | undefined,
  file: { name: string; type: string },
): boolean {
  const patterns = (accept ?? "")
    .split(",")
    .map(pattern => pattern.trim().toLowerCase())
    .filter(pattern => pattern !== "");
  if (patterns.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some(pattern => {
    if (pattern.startsWith(".")) return name.endsWith(pattern);
    if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}
