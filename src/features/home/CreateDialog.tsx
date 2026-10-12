import { type Template } from "@src/features/data";
import { hasDraftAtom, startNewTemplateAtom, startTemplateAtom } from "@src/features/edit/data";
import { TemplateFilePicker } from "@src/features/home/TemplateFilePicker";
import { Button } from "@src/shared/ui/Button";
import { ConfirmDialog } from "@src/shared/ui/ConfirmDialog";
import { Dialog } from "@src/shared/ui/Dialog";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: 型定義

export interface Props {
  open: boolean;
  onClose: () => void;
}

// #############################################################################
// MARK: コンポーネント

/** レイアウトを作る：続きから・新しく作る・テンプレートを読み込んで編集する。 */
export function CreateDialog(props: Props) {
  const hasDraft = useAtomValue(hasDraftAtom);
  const startNew = useSetAtom(startNewTemplateAtom);
  const startTemplate = useSetAtom(startTemplateAtom);
  const [loaded, setLoaded] = useState<Template>();
  /** 確かめている始め方。作業中の内容があるときに、破棄してよいか確かめる。 */
  const [pending, setPending] = useState<"new" | "load">();

  /** 編集の画面へ進む。kind がなければ、作業中の内容の続きから。 */
  function begin(kind?: "new" | "load") {
    if (kind === "new") startNew();
    if (kind === "load" && loaded) startTemplate(loaded);
    props.onClose();
    void navigate("/edit/schema");
  }

  /** 作業中の内容があれば、破棄してよいか確かめてから始める。 */
  function confirmThenBegin(kind: "new" | "load") {
    if (hasDraft) setPending(kind);
    else begin(kind);
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} title="レイアウトを作る">
      {hasDraft && (
        <Choice
          title="続きから編集"
          description="作業中のテンプレートの編集を続けます。"
          action="続ける"
          onClick={() => begin()}
        />
      )}
      <Choice
        title="新しく作る"
        description="空のテンプレートから作ります。"
        action="新しく作る"
        onClick={() => confirmThenBegin("new")}
      />
      <section className="flex flex-col gap-2 rounded-lg border border-surface-border p-3">
        <h3 className="font-bold">テンプレートを読み込んで編集</h3>
        <TemplateFilePicker value={loaded} onChange={setLoaded} />
        <div className="flex justify-end">
          <Button
            label="読み込んで編集"
            variant="primary"
            disabled={!loaded}
            onClick={() => confirmThenBegin("load")}
          />
        </div>
      </section>

      {/* 作成ダイアログの上に重ねて開く。 */}
      <ConfirmDialog
        open={pending !== undefined}
        title={pending === "load" ? "テンプレートを読み込みますか？" : "新しく作りますか？"}
        message="作業中の内容は破棄されます。保存していなければ、元に戻せません。"
        confirmLabel={pending === "load" ? "破棄して読み込む" : "破棄して新しく作る"}
        danger
        onConfirm={() => begin(pending)}
        onCancel={() => setPending(undefined)}
      />
    </Dialog>
  );
}

// #############################################################################
// MARK: 内部部品

/** 始め方の選択肢（説明とボタン）。 */
function Choice(props: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <section className="flex items-center gap-3 rounded-lg border border-surface-border p-3">
      <div className="flex flex-1 flex-col">
        <h3 className="font-bold">{props.title}</h3>
        <p className="text-sm text-text-secondary">{props.description}</p>
      </div>
      <Button label={props.action} variant="primary" onClick={props.onClick} />
    </section>
  );
}
