import Button from "@src/shared/ui/Button";
import { useEffect, useId, useRef, type ReactNode } from "react";

export interface Props {
  open: boolean;
  /** Esc キー・背景のクリック・閉じるボタンで閉じたとき。 */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** 下に並べるボタン。 */
  actions?: ReactNode;
}

/**
 * モーダルのダイアログ。HTML 標準の dialog（showModal）を使うため、
 * 開いている間はダイアログの外を操作できず、フォーカスもダイアログの中に留まる。
 * ほかのダイアログの上にも重ねて開ける。
 *
 * 開いているかどうかは open（呼び出し側の状態）だけが決める。Esc キーや背景のクリックでは、
 * ブラウザに閉じさせずに onClose を呼び、呼び出し側が open を変えたときに閉じる。
 * close イベントだけに頼ると、届かない・遅れる環境で状態とずれるため。
 */
export default function Dialog(props: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(props.onClose);
  onCloseRef.current = props.onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (props.open && !dialog.open) dialog.showModal();
    if (!props.open && dialog.open) dialog.close();
  }, [props.open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Esc キー。ブラウザに閉じさせず、呼び出し側に閉じてもらう。
    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    // ほかの理由でブラウザが閉じた場合も知らせる（閉じたままのときだけ。遅れて届くことがある）。
    const onClose = () => {
      if (!dialog.open) onCloseRef.current();
    };
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  return (
    <dialog ref={ref} className="modal" aria-labelledby={titleId}>
      <div className="modal-box flex flex-col gap-4 bg-surface text-text-primary">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <h2 id={titleId} className="text-lg font-bold">
              {props.title}
            </h2>
            {props.description && (
              <div className="text-sm text-text-secondary">{props.description}</div>
            )}
          </div>
          <Button icon="i-lucide-x" label="閉じる" iconOnly onClick={() => props.onClose()} />
        </div>
        {props.children}
        {props.actions && <div className="flex flex-wrap justify-end gap-2">{props.actions}</div>}
      </div>
      {/* 背景をクリックしたら閉じる。 */}
      <div className="modal-backdrop" aria-hidden="true" onClick={() => props.onClose()} />
    </dialog>
  );
}
