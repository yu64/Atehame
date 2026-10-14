import { NormalHeader } from "@src/app/NormalHeader";
import { PageFrame } from "@src/app/PageFrame";
import type { ReactNode } from "react";

/** テンプレートを作る工程（スキーマ・加工・レイアウト・保存）に共通の枠。 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <PageFrame>
      <NormalHeader />

      {children}
    </PageFrame>
  );
}
