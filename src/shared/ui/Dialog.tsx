import { Button } from "@src/shared/ui/Button";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

// #############################################################################
// MARK: 型定義

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

// #############################################################################
// MARK: 定数

/** daisyUI の modal の transition に、overlay（最前面に留める）を足したもの。 */
const closingTransition =
  "[transition:visibility_0.3s_allow-discrete,background-color_0.3s_ease-out,opacity_0.1s_ease-out,overlay_0.3s_allow-discrete]";

// #############################################################################
// MARK: コンポーネント

/**
 * モーダルのダイアログ。HTML 標準の dialog（showModal）を使うため、
 * 開いている間はダイアログの外を操作できず、フォーカスもダイアログの中に留まる。
 * ほかのダイアログの上にも重ねて開ける。
 *
 * 開いているかどうかは open（呼び出し側の状態）だけが決める。Esc キーや背景のクリックでは、
 * ブラウザに閉じさせずに onClose を呼び、呼び出し側が open を変えたときに閉じる。
 * close イベントだけに頼ると、届かない・遅れる環境で状態とずれるため。
 *
 * 閉じる動きの間も最前面（top layer）に留める（overlay の切り替えを遅らせる）。daisyUI の既定では
 * 閉じた瞬間に最前面から外れ、重ねたダイアログが下のダイアログの裏や枠の中に描かれて、
 * 暗い背景が先に消えて本体だけが残って見えるため。overlay に対応しないブラウザでも
 * 下のダイアログの枠に切り取られないよう、body の直下に置く。
 */
export function Dialog(props: Props) {
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
    /** Esc キー。ブラウザに閉じさせず、呼び出し側に閉じてもらう。 */
    function onCancel(event: Event) {
      event.preventDefault();
      onCloseRef.current();
    }
    /** ほかの理由でブラウザが閉じた場合も知らせる（閉じたままのときだけ。遅れて届くことがある）。 */
    function onClose() {
      if (!ref.current?.open) onCloseRef.current();
    }
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  return createPortal(
    <dialog ref={ref} className={`modal ${closingTransition}`} aria-labelledby={titleId}>
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
    </dialog>,
    document.body,
  );
}
