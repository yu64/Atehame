import { If } from "@src/components/util/If";
import { ComponentPropsWithoutRef, forwardRef, useId } from "react";


export interface Props extends ComponentPropsWithoutRef<"input"> {
  label?: string;
  description?: string;
}


export const Input = forwardRef<HTMLInputElement, Props>(
  function Input(props: Props, ref: React.ForwardedRef<HTMLInputElement>) {
    
    const id = props.id ?? useId();

    return (
      <fieldset className="fieldset m-0 p-0 gap-1">
        <If value={props.label}>
          <legend className="fieldset-legend m-0 pt-0 pb-1">
            {props.label}
          </legend>
        </If>
        <label className={`
          input 
          w-full
          focus-within:atehame-focus
        `}>
          <input 
            id={id}
            className="grow"
            ref={ref}
            {...props}
          />
        </label>
        <If value={props.description}>
          <span className="label">
            {props.description}
          </span>
        </If>
      </fieldset>
    )
  }
);

export default Input;
