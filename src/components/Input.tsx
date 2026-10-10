import { If } from "@src/components/util/If";
import { ComponentPropsWithoutRef, forwardRef, useId } from "react";

export interface Props extends ComponentPropsWithoutRef<"input"> {
  label?: string;
  description?: string;
  /** 指定時は説明の代わりにエラーとして表示する。 */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  props: Props,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const { label, description, error, ...inputProps } = props;
  const id = props.id ?? useId();
  const message = error ?? description;

  return (
    <fieldset className="fieldset m-0 p-0 gap-1">
      <If value={label}>
        <legend className="fieldset-legend m-0 pt-0 pb-1">{label}</legend>
      </If>
      <label
        className={`
          input
          w-full
          focus-within:atehame-focus
          ${error ? "border-status-error" : ""}
        `}
      >
        <input
          id={id}
          className="grow"
          ref={ref}
          aria-invalid={error ? true : undefined}
          {...inputProps}
        />
      </label>
      <If value={message}>
        <span className={`label whitespace-normal ${error ? "text-status-error" : ""}`}>
          {message}
        </span>
      </If>
    </fieldset>
  );
});

export default Input;
