import useSyncedText from "@src/shared/hooks/useSyncedText";
import { Input } from "@src/shared/ui/Input";
import { Select } from "@src/shared/ui/Select";

export interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  unit?: string;
  onChange: (value: number) => void;
}

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

export interface CssValueFieldProps {
  label: string;
  /** CSS の値。宣言がない場合は undefined。 */
  value: string | undefined;
  placeholder?: string;
  /** 空にすると undefined（宣言を取り除く）を通知する。 */
  onChange: (value: string | undefined) => void;
}

/** CSS の値をそのまま入力する欄（例: 14pt、1.5、40mm）。 */
export function CssValueField(props: CssValueFieldProps) {
  // 値は前後の空白を除いて書くため、空白を除いて同じなら打ちかけの空白を保つ。
  const value = props.value ?? "";
  const [text, setText] = useSyncedText(value, text => text.trim() === value);

  return (
    <Input
      type="text"
      label={props.label}
      value={text}
      placeholder={props.placeholder}
      spellCheck={false}
      onChange={event => {
        const next = event.currentTarget.value;
        setText(next);
        props.onChange(next.trim() === "" ? undefined : next.trim());
      }}
    />
  );
}

export interface CssChoiceFieldProps {
  label: string;
  value: string | undefined;
  /** value が "" の選択肢は「指定しない」（宣言を取り除く）。 */
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}

/** CSS の値を選ぶ欄。選択肢にない値が書かれている場合も、その値を選択肢に残す。 */
export function CssChoiceField(props: CssChoiceFieldProps) {
  const current = props.value ?? "";
  const options = props.options.some(option => option.value === current)
    ? props.options
    : [...props.options, { value: current, label: `${current}（CSS で指定）` }];

  return (
    <Select
      label={props.label}
      value={current}
      onChange={event => props.onChange(event.currentTarget.value || undefined)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
