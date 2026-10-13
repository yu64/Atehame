import { MainContent } from "@src/app/MainContent";
import { StepHeader } from "@src/app/StepHeader";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: コンポーネント

/** 確認と印刷。読み込んだ CSV の行に加工を実行し、プレビューして印刷する（準備中）。 */
export function PreviewPage() {
  return (
    <>
      <StepHeader
        title="確認と印刷"
        description="加工した結果を確かめ、印刷する行を選んで印刷します。"
        onBack={() => navigate("/use/load")}
      />
      <MainContent width="contained">
        <p className="py-6 text-sm text-text-secondary">準備中です。</p>
      </MainContent>
    </>
  );
}
