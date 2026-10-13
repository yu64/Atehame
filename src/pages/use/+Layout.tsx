import { NormalHeader } from "@src/app/NormalHeader";
import { PageFrame } from "@src/app/PageFrame";

// #############################################################################
// MARK: コンポーネント

/** テンプレートを使う工程（CSV の読み込み・確認と印刷）に共通の枠。 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PageFrame>
      <NormalHeader />

      {children}
    </PageFrame>
  );
}
