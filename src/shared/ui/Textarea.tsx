import Field from "@src/shared/ui/Field";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

export interface Props extends ComponentPropsWithoutRef<"textarea"> {
  label?: string;
  description?: ReactNode;
  error?: string;
}

/** 複数行の入力欄。 */
export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(props, ref) {
  const { label, description, error, className, ...textareaProps } = props;
  return (
    <Field label={label} description={description} error={error}>
      <textarea
        ref={ref}
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
});

export default Textarea;
