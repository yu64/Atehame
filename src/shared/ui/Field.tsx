import type { ReactNode } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  label?: string;
  description?: ReactNode;
  /** 指定時は説明の代わりにエラーとして表示する。 */
  error?: string;
  /** 入力欄など。 */
  children: ReactNode;
}

// #############################################################################
// MARK: コンポーネント

/** 入力欄の枠。見出し・入力欄・説明（またはエラー）を縦に並べる。 */
export function Field(props: Props) {
  const message = props.error ?? props.description;
  return (
    <fieldset className="fieldset m-0 p-0 gap-1">
      {props.label && <legend className="fieldset-legend m-0 pt-0 pb-1">{props.label}</legend>}
      {props.children}
      {message && (
        <span className={`label whitespace-normal ${props.error ? "text-status-error" : ""}`}>
          {message}
        </span>
      )}
    </fieldset>
  );
}
