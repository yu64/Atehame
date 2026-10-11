import { standardTemplates } from "@src/features/standard";
import { usingTemplateAtom } from "@src/features/use";
import Dialog from "@src/shared/ui/Dialog";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { navigate } from "vike/client/router";

export interface Props {
  open: boolean;
  onClose: () => void;
}

/** 標準レイアウトを使う：Atehame が用意したテンプレートから選ぶ。 */
export default function StandardDialog(props: Props) {
  const setUsing = useSetAtom(usingTemplateAtom);
  const [selectedId, setSelectedId] = useState(standardTemplates[0]?.id);
  const selected = standardTemplates.find(standard => standard.id === selectedId);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="標準レイアウトを使う"
      description="Atehame が用意したテンプレートから選びます。"
      actions={
        <button
          type="button"
          className="atehame-btn-primary"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            setUsing(selected.create());
            props.onClose();
            void navigate("/use");
          }}
        >
          このテンプレートを使う
        </button>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">テンプレート</legend>
        {standardTemplates.map(standard => (
          <label
            key={standard.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer
              ${selectedId === standard.id ? "border-primary" : "border-surface-border"}
            `}
          >
            <input
              type="radio"
              name="standard-template"
              className="radio radio-sm mt-0.5"
              checked={selectedId === standard.id}
              onChange={() => setSelectedId(standard.id)}
            />
            <span className="flex flex-col">
              <span className="font-bold">{standard.title}</span>
              <span className="text-sm text-text-secondary">{standard.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </Dialog>
  );
}
