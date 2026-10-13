import favicon from "@src/assets/logo.svg";
import type { Config } from "vike/types";
import vikeReact from "vike-react/config";

export default {
  ssr: false,
  extends: vikeReact,
  title: "ATEHAME",
  favicon,
} satisfies Config;
