import { type Template, TemplateFilePicker } from "@src/features/template";
import { usingTemplateAtom } from "@src/features/use";
import { Button } from "@src/shared/ui/Button";
import { Dialog } from "@src/shared/ui/Dialog";
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

/** レイアウトを使う：保存したテンプレートを読み込む。 */
export function UseDialog(props: Props) {
  const setUsing = useSetAtom(usingTemplateAtom);
  const [loaded, setLoaded] = useState<Template>();

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="レイアウトを使う"
      description="自分または他の人が作ったテンプレートのファイルを読み込みます。"
      actions={
        <Button
          label="このテンプレートを使う"
          variant="primary"
          size="md"
          disabled={!loaded}
          onClick={() => {
            if (!loaded) return;
            setUsing(loaded);
            props.onClose();
            void navigate("/use");
          }}
        />
      }
    >
      <TemplateFilePicker value={loaded} onChange={setLoaded} />
    </Dialog>
  );
}
