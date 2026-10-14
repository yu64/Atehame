import favicon from "@src/assets/logo.svg";
import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

export default {
  ssr: false,
  // サーバーなしで配信できるよう、ページごとの HTML をビルドのときに書き出す。
  prerender: true,
  extends: vikeReact,
  title: "ATEHAME",
  favicon,
} satisfies Config;
