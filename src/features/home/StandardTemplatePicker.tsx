import { type StandardTemplate, standardTemplates } from "@src/features/data";
import { RadioCardGroup } from "@src/shared/ui/RadioCardGroup";

// #############################################################################
// MARK: 型定義

export interface Props {
  /** 同じ画面で重ならない名前（ラジオボタンのまとまり）。 */
  name: string;
  value: StandardTemplate | undefined;
  onChange: (standard: StandardTemplate) => void;
}

// #############################################################################
// MARK: コンポーネント

/** 標準テンプレートを1つ選ぶ。 */
export function StandardTemplatePicker(props: Props) {
  return (
    <RadioCardGroup
      name={props.name}
      legend="標準テンプレート"
      hideLegend
      options={standardTemplates.map(standard => ({
        value: standard.id,
        label: standard.title,
        description: standard.description,
      }))}
      value={props.value?.id}
      onChange={id => {
        const standard = standardTemplates.find(item => item.id === id);
        if (standard) props.onChange(standard);
      }}
    />
  );
}
