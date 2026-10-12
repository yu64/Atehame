import { useSyncedText } from "@src/shared/hooks/useSyncedText";
import { Input } from "@src/shared/ui/Input";

// #############################################################################
// MARK: 型定義

export interface CssValueFieldProps {
  label: string;
  /** CSS の値。宣言がない場合は undefined。 */
  value: string | undefined;
  placeholder?: string;
  /** 空にすると undefined（宣言を取り除く）を通知する。 */
  onChange: (value: string | undefined) => void;
}

// #############################################################################
// MARK: コンポーネント

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
