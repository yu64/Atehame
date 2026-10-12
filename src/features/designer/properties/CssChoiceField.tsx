import { Select } from "@src/shared/ui/Select";

// #############################################################################
// MARK: 型定義

export interface CssChoiceFieldProps {
  label: string;
  value: string | undefined;
  /** value が "" の選択肢は「指定しない」（宣言を取り除く）。 */
  options: Array<{ value: string; label: string }>;
  onChange: (value: string | undefined) => void;
}

// #############################################################################
// MARK: コンポーネント

/** CSS の値を選ぶ欄。選択肢にない値が書かれている場合も、その値を選択肢に残す。 */
export function CssChoiceField(props: CssChoiceFieldProps) {
  const current = props.value ?? "";
  const options = (
    props.options.some(option => option.value === current)
    ? props.options
    : [...props.options, { value: current, label: `${current}（CSS で指定）` }]
  );

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
