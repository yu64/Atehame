import {
  hasDraftAtom,
  startNewTemplateAtom,
  startTemplateAtom,
  TemplateFilePicker,
  type Template,
} from "@src/features/template";
import Dialog from "@src/shared/ui/Dialog";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { navigate } from "vike/client/router";

export interface Props {
  open: boolean;
  onClose: () => void;
}

/** レイアウトを作る：続きから・新しく作る・テンプレートを読み込んで編集する。 */
export default function CreateDialog(props: Props) {
  const hasDraft = useAtomValue(hasDraftAtom);
  const startNew = useSetAtom(startNewTemplateAtom);
  const startTemplate = useSetAtom(startTemplateAtom);
  const [loaded, setLoaded] = useState<Template>();

  const begin = (start: () => void) => {
    start();
    props.onClose();
    void navigate("/edit/schema");
  };

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        setLoaded(undefined);
        props.onClose();
      }}
      title="レイアウトを作る"
      description={
        hasDraft
          ? "新しく作る・読み込むと、作業中の内容は破棄されます（保存していなければ戻せません）。"
          : undefined
      }
    >
      {hasDraft && (
        <Choice
          title="続きから編集"
          description="作業中のテンプレートの編集を続けます。"
          action="続ける"
          onClick={() => begin(() => {})}
        />
      )}
      <Choice
        title="新しく作る"
        description="空のテンプレートから作ります。"
        action="新しく作る"
        onClick={() => begin(startNew)}
      />
      <section className="flex flex-col gap-2 rounded-lg border border-surface-border p-3">
        <h3 className="font-bold">テンプレートを読み込んで編集</h3>
        <TemplateFilePicker value={loaded} onChange={setLoaded} />
        <div className="flex justify-end">
          <button
            type="button"
            className="atehame-btn-primary btn-sm"
            disabled={!loaded}
            onClick={() => loaded && begin(() => startTemplate(loaded))}
          >
            読み込んで編集
          </button>
        </div>
      </section>
    </Dialog>
  );
}

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
      <button type="button" className="atehame-btn-primary btn-sm" onClick={props.onClick}>
        {props.action}
      </button>
    </section>
  );
}
