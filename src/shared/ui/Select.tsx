import { useFixedLongestSelect } from "@src/shared/hooks/useFixedLongestSelect";
import { Field } from "@src/shared/ui/Field";
import {
  type ComponentPropsWithRef,
  type JSX,
  type ReactElement,
  useId,
  useImperativeHandle,
  useRef,
} from "react";

export interface Props extends ComponentPropsWithRef<"select"> {
  label?: string;
  description?: string;
  children?: ReactElement<JSX.IntrinsicElements["option"]>[];
}

export function Select(props: Props) {
  const { label, description, children, ref, ...selectProps } = props;
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const selectRef = useRef<HTMLSelectElement>(null);
  useFixedLongestSelect(selectRef);

  // 親の ref と内部の ref を同期
  useImperativeHandle(ref, () => selectRef.current!, []);

  return (
    <Field label={label} description={description}>
      <select
        id={id}
        className={`
            select
            w-full
            focus-within:atehame-focus
            select-open:atehame-focus
          `}
        ref={selectRef}
        {...selectProps}
      >
        {children}
      </select>
    </Field>
  );
}
