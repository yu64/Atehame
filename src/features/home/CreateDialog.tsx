import { type Template } from "@src/features/data";
import { hasDraftAtom, startNewTemplateAtom, startTemplateAtom } from "@src/features/edit/data";
import { StandardTemplateDialog } from "@src/features/home/StandardTemplateDialog";
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

/** 始め方。"new" は空から、"standard" は標準テンプレートを選んでから、テンプレートはそれを編集する。 */
type Start = "new" | "standard" | Template;

// #############################################################################
// MARK: 定数

/** 作業中の内容を破棄してよいか確かめるときの文言。 */
const confirmTexts = {
  new: {
    title: "新しく作りますか？",
    label: "破棄して新しく作る",
  },
  standard: {
    title: "標準テンプレートから作りますか？",
    label: "破棄して選ぶ",
  },
  load: {
    title: "テンプレートを読み込みますか？",
    label: "破棄して読み込む",
  },
};

// #############################################################################
// MARK: コンポーネント

/** テンプレートを作る：続きから・新しく作る・標準テンプレートや保存したテンプレートを編集する。 */
export function CreateDialog(props: Props) {
  const hasDraft = useAtomValue(hasDraftAtom);
  const startNew = useSetAtom(startNewTemplateAtom);
  const startTemplate = useSetAtom(startTemplateAtom);
  const [loaded, setLoaded] = useState<Template>();
  /** 標準テンプレートを選ぶダイアログを重ねて開いているか。 */
  const [choosingStandard, setChoosingStandard] = useState(false);
  /** 確かめている始め方。作業中の内容があるときに、破棄してよいか確かめる。 */
  const [pending, setPending] = useState<Start>();
  /** 確認の文言。閉じる動きの間も文言が残るよう、pending とは別に持ち、開くときだけ変える。 */
  const [confirm, setConfirm] = useState(confirmTexts.new);

  /** 編集の画面へ進む。start がなければ、作業中の内容の続きから。 */
  function begin(start?: "new" | Template) {
    if (start === "new") startNew();
    else if (start) startTemplate(start);
    props.onClose();
    void navigate("/edit/schema");
  }

  /**
   * 始める。標準テンプレートは、選ぶダイアログを開く（決定したらそのまま編集へ進む）。
   * 作業中の内容があれば、その前に破棄してよいか確かめる。
   */
  function confirmThenStart(start: Start, confirmed = false) {
    if (hasDraft && !confirmed) {
      setPending(start);
      setConfirm(confirmTexts[(typeof start === "string" ? start : "load")]);
    } else if (start === "standard") {
      setPending(undefined);
      setChoosingStandard(true);
    } else begin(start);
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} title="テンプレートを作る">
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
        onClick={() => confirmThenStart("new")}
      />
      <Choice
        title="標準テンプレートから作る"
        description="Atehame が用意したテンプレートを元に作ります。"
        action="選ぶ"
        onClick={() => confirmThenStart("standard")}
      />
      <section className="flex flex-col gap-2 rounded-lg border border-surface-border p-3">
        <h3 className="font-bold">テンプレートを読み込んで編集</h3>
        <TemplateFilePicker value={loaded} onChange={setLoaded} />
        <div className="flex justify-end">
          <Button
            label="読み込んで編集"
            variant="primary"
            disabled={!loaded}
            onClick={() => {
              if (loaded) confirmThenStart(loaded);
            }}
          />
        </div>
      </section>

      {/* 作成ダイアログの上に重ねて開く。破棄の確認は選ぶ前に済ませ、決定したら編集へ進む。 */}
      <StandardTemplateDialog
        open={choosingStandard}
        onClose={() => setChoosingStandard(false)}
        title="標準テンプレートから作る"
        description="元にするテンプレートを選びます。"
        actionLabel="このテンプレートで作る"
        onDecide={begin}
      />
      <ConfirmDialog
        open={pending !== undefined}
        title={confirm.title}
        message="作業中の内容は破棄されます。保存していなければ、元に戻せません。"
        confirmLabel={confirm.label}
        danger
        onConfirm={() => {
          if (pending) confirmThenStart(pending, true);
        }}
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
