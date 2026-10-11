import type { ReactNode } from "react";

export interface Props {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** ツールチップ（補足の説明）。 */
  title?: string;
  disabled?: boolean;
  className?: string;
}

/** 見出し付きのチェックボックス。見出しを押しても切り替わる。 */
export default function Checkbox(props: Props) {
  return (
    <label
      className={`
        flex items-center gap-2 text-sm
        ${props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${props.className ?? ""}
      `}
      title={props.title}
    >
      <input
        type="checkbox"
        className="checkbox checkbox-sm"
        checked={props.checked}
        disabled={props.disabled}
        onChange={event => props.onChange(event.currentTarget.checked)}
      />
      {props.label}
    </label>
  );
}
