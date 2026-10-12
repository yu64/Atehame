import { Button } from "@src/shared/ui/Button";
import { Dialog } from "@src/shared/ui/Dialog";
import type { ReactNode } from "react";

export interface Props {
  open: boolean;
  title: string;
  message?: ReactNode;
  /** 実行するボタンの文言（例: 削除する）。 */
  confirmLabel: string;
  cancelLabel?: string;
  /** 削除・破棄など、取り消せない操作なら赤色にする。 */
  danger?: boolean;
  onConfirm: () => void;
  /** やめるボタン・Esc キー・背景のクリックで閉じたとき。 */
  onCancel: () => void;
}

/**
 * 実行してよいかを確かめるダイアログ。ほかのダイアログの上にも重ねて開ける
 * （後から開いたダイアログが前面になり、閉じると下のダイアログに戻る）。
 */
export function ConfirmDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onCancel}
      title={props.title}
      description={props.message}
      actions={
        <>
          <Button label={props.cancelLabel ?? "やめる"} size="md" onClick={props.onCancel} />
          <Button
            label={props.confirmLabel}
            variant={props.danger ? "secondary" : "primary"}
            danger={props.danger}
            size="md"
            onClick={props.onConfirm}
          />
        </>
      }
    />
  );
}
