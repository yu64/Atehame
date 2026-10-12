import { useSyncedText } from "@src/shared/hooks/useSyncedText";
import { Input } from "@src/shared/ui/Input";

// #############################################################################
// MARK: 型定義

export interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  unit?: string;
  onChange: (value: number) => void;
}

// #############################################################################
// MARK: コンポーネント

/** 数値の入力欄。数値として読める値だけを通知する。 */
export function NumberField(props: NumberFieldProps) {
  const [text, setText] = useSyncedText(String(props.value), text => Number(text) === props.value);

  return (
    <Input
      type="number"
      label={props.unit ? `${props.label}（${props.unit}）` : props.label}
      value={text}
      step={props.step ?? 0.1}
      min={props.min}
      onChange={event => {
        const next = event.currentTarget.value;
        setText(next);
        const value = Number(next);
        if (next.trim() !== "" && Number.isFinite(value)) props.onChange(value);
      }}
    />
  );
}
