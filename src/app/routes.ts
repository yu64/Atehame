// #############################################################################
// MARK: 定数

/**
 * 公開先のパス（末尾の / なし）。手元では空、GitHub Pages では "/リポジトリ名"。
 * 画面の移動は公開先のパスを自動では足さないため、URL の先頭に付ける。
 */
const base = (
  (import.meta.env.BASE_URL.endsWith("/"))
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL
);

/**
 * 画面の URL。公開先のパスの後ろは、src/pages のフォルダの構成と同じにする（ルーティングはフォルダで決まる）。
 * 画面の移動では、文字列を直接書かずにここから選ぶ。
 */
export const routes = {
  home: `${base}/`,
  /** テンプレートを作る工程。上から順に進む。 */
  edit: {
    schema: `${base}/edit/schema`,
    transform: `${base}/edit/transform`,
    layout: `${base}/edit/layout`,
    save: `${base}/edit/save`,
  },
  /** テンプレートを使う工程。上から順に進む。 */
  use: {
    load: `${base}/use/load`,
    preview: `${base}/use/preview`,
  },
} as const;
