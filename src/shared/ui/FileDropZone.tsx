import { acceptsFile } from "@src/shared/lib/fileAccept";
import { Button } from "@src/shared/ui/Button";
import { type ReactNode, useRef, useState } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  /** 受け付けるファイルの種類（input の accept と同じ書き方）。ドロップしたファイルにも効く。 */
  accept?: string;
  multiple?: boolean;
  /** 選んだ・ドロップしたファイル。 */
  onFiles: (files: File[]) => void;
  /**
   * 受け付けない種類のファイルがあったとき。理由は枠の中に出すので、前に出した結果を消すのに使う。
   * 受け付けたファイルもあるときは、onFiles より先に呼ぶ。
   */
  onReject?: (files: File[]) => void;
  /** ボタンの文言。 */
  label?: string;
  /** 補足の説明。 */
  hint?: ReactNode;
  disabled?: boolean;
}

// #############################################################################
// MARK: コンポーネント

/**
 * ファイルを選ぶか、ドロップして受け取る場所。枠の中のどこを押しても、ファイルを選ぶ画面が開く。
 * 受け付けない種類のファイルは渡さず、枠の中に理由を出す。
 */
export function FileDropZone(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  /** 受け付けなかったファイルの名前。 */
  const [rejected, setRejected] = useState<string[]>([]);

  /** 受け付ける種類のファイルだけを知らせる（複数を受け付けない場合は1つだけ）。 */
  function receive(files: File[]) {
    if (props.disabled || files.length === 0) return;
    const accepted = files.filter(file => acceptsFile(props.accept, file));
    const others = files.filter(file => !accepted.includes(file));
    setRejected(others.map(file => file.name));
    if (others.length > 0) props.onReject?.(others);
    if (accepted.length > 0) props.onFiles(props.multiple ? accepted : accepted.slice(0, 1));
  }

  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed text-center
        ${dragging ? "border-primary bg-surface-hover" : "border-surface-border"}
        ${props.disabled ? "opacity-50" : "cursor-pointer hover:bg-surface-hover"}
      `}
      onClick={event => {
        // ボタンを押したときも、ここで開く。input のクリック（開く操作そのもの）は除く。
        if (props.disabled || event.target === inputRef.current) return;
        inputRef.current?.click();
      }}
      onDragOver={event => {
        event.preventDefault();
        if (!props.disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        receive([...event.dataTransfer.files]);
      }}
    >
      <span className="i-lucide-upload size-6 text-text-secondary" aria-hidden="true" />
      <Button label={props.label ?? "ファイルを選ぶ"} disabled={props.disabled} />
      <span className="text-xs text-text-secondary">またはここにドロップ</span>
      {props.hint && <span className="text-xs text-text-tertiary">{props.hint}</span>}
      {rejected.length > 0 && (
        <span role="alert" className="text-xs text-status-error">
          {rejected.map(name => `「${name}」`).join("")}は、受け付けていない種類のファイルです。
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={props.accept}
        multiple={props.multiple}
        hidden
        onChange={event => {
          receive([...(event.currentTarget.files ?? [])]);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
