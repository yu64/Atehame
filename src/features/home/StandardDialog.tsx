import type { Template } from "@src/features/data";
import { StandardTemplateDialog } from "@src/features/home/StandardTemplateDialog";
import { startUsingAtom } from "@src/features/use/data";
import { useSetAtom } from "jotai";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: 型定義

export interface Props {
  open: boolean;
  onClose: () => void;
}

// #############################################################################
// MARK: コンポーネント

/** 標準テンプレートを使う：Atehame が用意したテンプレートから選ぶ。 */
export function StandardDialog(props: Props) {
  const setUsing = useSetAtom(startUsingAtom);

  /** 選んだテンプレートで、CSV の読み込みへ進む。 */
  function use(template: Template) {
    setUsing(template);
    props.onClose();
    void navigate("/use/load");
  }

  return (
    <StandardTemplateDialog
      open={props.open}
      onClose={props.onClose}
      title="標準テンプレートを使う"
      description="Atehame が用意したテンプレートから選びます。"
      actionLabel="このテンプレートを使う"
      onDecide={use}
    />
  );
}
