import { standardTemplates, type Template } from "@src/features/data";
import { useStandardTemplateLoader } from "@src/features/home/hooks/useStandardTemplateLoader";
import { StandardTemplatePicker } from "@src/features/home/StandardTemplatePicker";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { Dialog } from "@src/shared/ui/Dialog";
import { useId, useState } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** 決定のボタンの文言。 */
  actionLabel: string;
  /** 選んだテンプレートを読み込めたとき。 */
  onDecide: (template: Template) => void;
}

// #############################################################################
// MARK: コンポーネント

/** 標準テンプレートを1つ選び、中身を読み込んで渡す。ほかのダイアログの上にも重ねて開ける。 */
export function StandardTemplateDialog(props: Props) {
  const name = useId();
  const loader = useStandardTemplateLoader();
  const [selected, setSelected] = useState(standardTemplates[0]);

  /** 選んだテンプレートを読み込んで渡す。読み込めなければ、理由を出して留まる。 */
  async function decide() {
    if (!selected) return;
    const template = await loader.load(selected);
    if (template) props.onDecide(template);
  }

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      description={props.description}
      actions={
        <Button
          label={props.actionLabel}
          variant="primary"
          size="md"
          disabled={!selected || loader.loading}
          onClick={() => void decide()}
        />
      }
    >
      <StandardTemplatePicker name={name} value={selected} onChange={setSelected} />
      {loader.error && <Alert kind="error" messages={[loader.error]} />}
    </Dialog>
  );
}
