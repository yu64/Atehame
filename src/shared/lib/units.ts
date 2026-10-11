/** CSS の 1mm に相当する px（CSS の 1in = 96px）。 */
export const pxPerMm = 96 / 25.4;

/** CSS の長さの単位ごとの mm。 */
const mmPerUnit: Record<string, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
  pc: 25.4 / 6,
  px: 25.4 / 96,
  q: 0.25,
};

/** CSS の長さ（"10mm" や "12pt" など）を mm にする。読めない場合は undefined。 */
export function lengthToMm(value: string): number | undefined {
  const match = value.trim().match(/^(-?\d*\.?\d+)(mm|cm|in|pt|pc|px|q)$/i);
  if (!match) return value.trim() === "0" ? 0 : undefined;
  return Number(match[1]) * mmPerUnit[match[2].toLowerCase()];
}

/** mm の数値を CSS の長さにする（0.01mm 単位）。 */
export function formatMm(value: number): string {
  return `${Math.round(value * 100) / 100}mm`;
}

/** バイト数を読みやすい単位にする（例: 820KB、1.2MB）。 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`;
}
