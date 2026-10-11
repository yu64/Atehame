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
    // Esc キーなど、ブラウザが閉じた場合も知らせる。
    const onClose = () => onCloseRef.current();
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
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
          <button
            type="button"
            className="atehame-btn-secondary btn-sm btn-square p-0"
            aria-label="閉じる"
            title="閉じる"
            onClick={() => props.onClose()}
          >
            <span className="i-lucide-x size-4" aria-hidden="true" />
          </button>
        </div>
        {props.children}
        {props.actions && <div className="flex flex-wrap justify-end gap-2">{props.actions}</div>}
      </div>
      {/* 背景をクリックしたら閉じる。 */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit" tabIndex={-1} aria-hidden="true">
          閉じる
        </button>
      </form>
    </dialog>
  );
}
