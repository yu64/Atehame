import { Field } from "@src/shared/ui/Field";
import { type ComponentPropsWithRef, useId } from "react";

// #############################################################################
// MARK: 型定義

export interface Props extends ComponentPropsWithRef<"input"> {
  label?: string;
  description?: string;
  /** 指定時は説明の代わりにエラーとして表示する。 */
  error?: string;
}

// #############################################################################
// MARK: コンポーネント

/** 1行の入力欄。見出し・説明・エラーを添えられる。 */
export function Input(props: Props) {
  const { label, description, error, ...inputProps } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;

  return (
    <Field label={label} description={description} error={error}>
      <label
        className={`
          input
          w-full
          focus-within:atehame-focus
          ${error ? "border-status-error" : ""}
        `}
      >
        <input id={id} className="grow" aria-invalid={error ? true : undefined} {...inputProps} />
      </label>
    </Field>
  );
}
