import "uno.css";
import "@src/app/i18n";
import type { ReactNode } from "react";

/** すべてのページを包む。スタイル（UnoCSS）と翻訳（i18n）を、ここで全体に読み込む。 */
export default function Wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
