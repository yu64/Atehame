// #############################################################################
// MARK: 定数

/**
 * 画面の URL。src/pages のフォルダの構成と同じにする（ルーティングはフォルダで決まる）。
 * 画面の移動では、文字列を直接書かずにここから選ぶ。
 */
export const routes = {
  home: "/",
  /** テンプレートを作る工程。上から順に進む。 */
  edit: {
    schema: "/edit/schema",
    transform: "/edit/transform",
    layout: "/edit/layout",
    save: "/edit/save",
  },
  /** テンプレートを使う工程。上から順に進む。 */
  use: {
    load: "/use/load",
    preview: "/use/preview",
  },
} as const;
