/**
 * テンプレートの CSS で使えるフォントの変数。フォントファイルは配信せず、閲覧者の端末のフォントを使う。
 * MS明朝などの Windows 付属フォントは、CSS で名前を指定して使うことは許可されているが、
 * 配信（サーバーへの配置や WOFF への変換）は許可されていない。
 */
export const fontVariables = {
  mincho: {
    variable: "--atehame-font-mincho",
    label: "明朝",
    family:
      '"MS Mincho", "ＭＳ 明朝", "Yu Mincho", "游明朝", "YuMincho", "Hiragino Mincho ProN", "Noto Serif JP", serif',
  },
  gothic: {
    variable: "--atehame-font-gothic",
    label: "ゴシック",
    family:
      '"MS Gothic", "ＭＳ ゴシック", "Yu Gothic", "游ゴシック", "YuGothic", "Hiragino Sans", "Noto Sans JP", sans-serif',
  },
} as const;

export type FontKey = keyof typeof fontVariables;

/** CSS でフォントを指定していない部品のフォント。 */
export const defaultFont: FontKey = "mincho";

/** font-family に指定する値（例: var(--atehame-font-mincho)）。 */
export function fontFamilyValue(key: FontKey): string {
  return `var(${fontVariables[key].variable})`;
}
