import type { PageSize } from "@src/features/designer/layoutCss";
import { type PaperPreset, paperPresetOf, paperPresets } from "@src/features/designer/model";
import { CssChoiceField } from "@src/features/designer/properties/CssChoiceField";
import { NumberField } from "@src/features/designer/properties/NumberField";

export interface Props {
  paper: PageSize;
  /** 用紙の大きさ（mm）を変える。CSS の @page の size を書き換える。 */
  onChange: (size: PageSize) => void;
}

/** 用紙の設定。部品を選択していないときに表示する。 */
export function PaperProperties(props: Props) {
  const preset = paperPresetOf(props.paper);
  const options = (Object.keys(paperPresets) as PaperPreset[]).map(key => ({
    value: key,
    label: `${paperPresets[key].label}（${paperPresets[key].width}×${paperPresets[key].height}mm）`,
  }));

  return (
    <div className="flex flex-col gap-4 p-3">
      <h2 className="font-bold text-text-primary">用紙</h2>
      <CssChoiceField
        label="用紙の種類"
        value={preset ?? "custom"}
        options={[...options, { value: "custom", label: "任意のサイズ" }]}
        onChange={value => {
          const selected = value as PaperPreset | "custom" | undefined;
          if (selected && selected !== "custom") {
            const { width, height } = paperPresets[selected];
            props.onChange({ width, height });
          }
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="幅"
          unit="mm"
          value={props.paper.width}
          min={10}
          onChange={width => width >= 10 && props.onChange({ width, height: props.paper.height })}
        />
        <NumberField
          label="高さ"
          unit="mm"
          value={props.paper.height}
          min={10}
          onChange={height => height >= 10 && props.onChange({ width: props.paper.width, height })}
        />
      </div>
      <p className="text-xs text-text-secondary">
        用紙の大きさは CSS の <code className="font-mono">@page {"{ size: … }"}</code>{" "}
        に書かれます。部品を選択すると、ここにその設定が表示されます。
      </p>
    </div>
  );
}
