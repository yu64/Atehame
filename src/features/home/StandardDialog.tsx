import { usingTemplateAtom } from "@src/features/use/data";
import { standardTemplates } from "@src/features/use/standard";
import { Button } from "@src/shared/ui/Button";
import { Dialog } from "@src/shared/ui/Dialog";
import { RadioCardGroup } from "@src/shared/ui/RadioCardGroup";
import { useSetAtom } from "jotai";
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

/** 標準レイアウトを使う：Atehame が用意したテンプレートから選ぶ。 */
export function StandardDialog(props: Props) {
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
        <Button
          label="このテンプレートを使う"
          variant="primary"
          size="md"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            setUsing(selected.create());
            props.onClose();
            void navigate("/use/load");
          }}
        />
      }
    >
      <RadioCardGroup
        name="standard-template"
        legend="テンプレート"
        hideLegend
        options={standardTemplates.map(standard => ({
          value: standard.id,
          label: standard.title,
          description: standard.description,
        }))}
        value={selectedId}
        onChange={setSelectedId}
      />
    </Dialog>
  );
}
