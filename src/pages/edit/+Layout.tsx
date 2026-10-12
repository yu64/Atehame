import { NormalHeader } from "@src/app/NormalHeader";
import { PageFrame } from "@src/app/PageFrame";

/** テンプレートを作る工程（スキーマ・加工・レイアウト・保存）に共通の枠。 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PageFrame>
      <NormalHeader />

      {children}
    </PageFrame>
  );
}
