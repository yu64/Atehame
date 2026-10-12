import "uno.css";
import "@src/app/i18n";
import React from "react";

/** すべてのページを包む。状態（jotai）と翻訳（i18n）を全体で使えるようにする。 */
export default function Wrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
