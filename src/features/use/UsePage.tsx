import { MainContent } from "@src/app/MainContent";
import { NormalHeader } from "@src/app/NormalHeader";
import { PageFrame } from "@src/app/PageFrame";
import { StepHeader } from "@src/app/StepHeader";
import { TemplateSummary } from "@src/features/template";
import { usingTemplateAtom } from "@src/features/use/store";
import { useAtomValue } from "jotai";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: コンポーネント

/** テンプレートを使う画面。CSV を入れてプレビュー・出力する（準備中）。 */
export function UsePage() {
  const template = useAtomValue(usingTemplateAtom);

  return (
    <PageFrame>
      <NormalHeader />
      <StepHeader
        title="テンプレートを使う"
        description="CSV を読み込み、テンプレートに当てはめて印刷します。"
        onBack={() => navigate("/")}
      />
      <MainContent width="contained">
        <div className="flex flex-col gap-4 py-6 max-w-2xl">
          {(
            template
            ? (
              <>
                <TemplateSummary template={template} />
                <p className="text-sm text-text-secondary">
                  CSV の読み込みと、プレビュー・出力は準備中です。
                </p>
              </>
            )
            : (
              <p className="text-sm text-text-secondary">
                テンプレートが選ばれていません。トップに戻って選んでください。
              </p>
            )
          )}
        </div>
      </MainContent>
    </PageFrame>
  );
}
