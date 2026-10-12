import { MainContent } from "@src/app/MainContent";
import { NormalHeader } from "@src/app/NormalHeader";
import { PageFrame } from "@src/app/PageFrame";
import { CreateDialog } from "@src/features/home/CreateDialog";
import { StandardDialog } from "@src/features/home/StandardDialog";
import { UseDialog } from "@src/features/home/UseDialog";
import { SelectCard } from "@src/shared/ui/SelectCard";
import { useState } from "react";

type HomeDialog = "standard" | "create" | "use";

/** トップ。3つの使い方から選び、それぞれのダイアログで始め方を選ぶ。 */
export function HomePage() {
  const [dialog, setDialog] = useState<HomeDialog>();
  function close() {
    setDialog(undefined);
  }

  return (
    <PageFrame>
      <NormalHeader />

      <MainContent>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
          <div className="md:col-span-2">
            <SelectCard
              title="標準レイアウトを使う"
              description="Atehameが提供するレイアウトを使用します。"
              buttonText="始める"
              onClick={() => setDialog("standard")}
            />
          </div>
          <SelectCard
            title="レイアウトを作る"
            description="自分でレイアウトを作成します。保存したテンプレートの編集もここから。"
            buttonText="始める"
            onClick={() => setDialog("create")}
          />
          <SelectCard
            title="レイアウトを使う"
            description="自分または他の人が作成したレイアウトを使用します。"
            buttonText="始める"
            onClick={() => setDialog("use")}
          />
        </section>
      </MainContent>

      {/* 開くたびに作り直し、前に選んだファイルなどを残さない。 */}
      {dialog === "standard" && <StandardDialog open onClose={close} />}
      {dialog === "create" && <CreateDialog open onClose={close} />}
      {dialog === "use" && <UseDialog open onClose={close} />}
    </PageFrame>
  );
}
