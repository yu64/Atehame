import useFixedLongestSelect from "@src/shared/hooks/useFixedLongestSelect";
import { If } from "@src/shared/ui/If";
import {
  Children,
  forwardRef,
  isValidElement,
  JSX,
  useId,
  useImperativeHandle,
  useRef,
} from "react";

export interface Props extends React.ComponentPropsWithoutRef<"select"> {
  label?: string;
  description?: string;
  children?: React.ReactElement<JSX.IntrinsicElements["option"]>[];
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  props: Props,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  const id = props.id ?? useId();
  const selectRef = useRef<HTMLSelectElement>(null);
  useFixedLongestSelect(selectRef);

  // 親の ref と内部の ref を同期
  useImperativeHandle(ref, () => selectRef.current!, []);

  return (
    <fieldset className="fieldset m-0 p-0 gap-1">
      <If value={props.label}>
        <legend className="fieldset-legend m-0 pt-0 pb-1">{props.label}</legend>
      </If>
      <select
        id={id}
        className={`
            select
            w-full
            focus-within:atehame-focus
            select-open:atehame-focus
          `}
        ref={selectRef}
        {...props}
      >
        {props.children}
      </select>
      <If value={props.description}>
        <span className="label">{props.description}</span>
      </If>
    </fieldset>
  );
});

export default Select;
