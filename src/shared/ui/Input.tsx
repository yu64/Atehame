import { Field } from "@src/shared/ui/Field";
import { type ComponentPropsWithRef, useId } from "react";

export interface Props extends ComponentPropsWithRef<"input"> {
  label?: string;
  description?: string;
  /** 指定時は説明の代わりにエラーとして表示する。 */
  error?: string;
}

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
