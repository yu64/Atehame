import { Button } from "@src/shared/ui/Button";
import { type ReactNode, useRef, useState } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  /** 選べるファイルの種類（input の accept と同じ書き方）。 */
  accept?: string;
  multiple?: boolean;
  /** 選んだ・ドロップしたファイル。 */
  onFiles: (files: File[]) => void;
  /** ボタンの文言。 */
  label?: string;
  /** 補足の説明。 */
  hint?: ReactNode;
  disabled?: boolean;
}

// #############################################################################
// MARK: コンポーネント

/** ファイルを選ぶか、ドロップして受け取る場所。 */
export function FileDropZone(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  /** 受け取ったファイルを知らせる（複数を受け付けない場合は1つだけ）。 */
  function receive(files: File[]) {
    if (props.disabled || files.length === 0) return;
    props.onFiles(props.multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed text-center
        ${dragging ? "border-primary bg-surface-hover" : "border-surface-border"}
        ${props.disabled ? "opacity-50" : ""}
      `}
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
      <Button
        label={props.label ?? "ファイルを選ぶ"}
        disabled={props.disabled}
        onClick={() => inputRef.current?.click()}
      />
      <span className="text-xs text-text-secondary">またはここにドロップ</span>
      {props.hint && <span className="text-xs text-text-tertiary">{props.hint}</span>}
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
