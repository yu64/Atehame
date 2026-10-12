import { Field } from "@src/shared/ui/Field";
import { type ComponentPropsWithRef, type ReactNode } from "react";

export interface Props extends ComponentPropsWithRef<"textarea"> {
  label?: string;
  description?: ReactNode;
  error?: string;
}

/** 複数行の入力欄。 */
export function Textarea(props: Props) {
  const { label, description, error, className, ...textareaProps } = props;
  return (
    <Field label={label} description={description} error={error}>
      <textarea
        className={`
          textarea w-full focus-within:atehame-focus
          ${error ? "border-status-error" : ""}
          ${className ?? ""}
        `}
        aria-invalid={error ? true : undefined}
        {...textareaProps}
      />
    </Field>
  );
}
