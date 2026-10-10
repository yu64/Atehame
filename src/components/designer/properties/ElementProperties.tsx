import { CssChoiceField, CssValueField } from "@src/components/designer/properties/fields";
import NameField from "@src/components/designer/properties/NameField";
import TextTemplateField from "@src/components/designer/properties/TextTemplateField";
import {
  decodeCssString,
  encodeCssString,
  splitProperty,
  textProperty,
  type ElementRule,
} from "@src/logic/layoutCss";
import { defaultFont, fontFamilyValue, fontVariables, type FontKey } from "@src/logic/render";

export interface Props {
  rule: ElementRule;
  /** ほかの部品の名前（重複の確認用）。 */
  otherNames: string[];
  fields: string[];
  /** 宣言を設定する。value が undefined なら取り除く。 */
  onDeclaration: (property: string, value: string | undefined) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onReorder: (to: "front" | "back") => void;
  onShowCss: () => void;
}

const fontOptions = (Object.keys(fontVariables) as FontKey[]).map(key => ({
  value: fontFamilyValue(key),
  label: fontVariables[key].label,
}));

/**
 * 部品の設定。値はすべて部品の CSS の規則（[data-name="名前"]）を読み書きする。
 * ここにない設定は CSS タブで直接書く。
 */
export default function ElementProperties(props: Props) {
  const { rule } = props;
  const value = (property: string) => rule.declarations.get(property)?.value;
  const set = (property: string) => (next: string | undefined) =>
    props.onDeclaration(property, next);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex flex-col gap-2">
        <h2 className="min-w-0 truncate font-bold text-text-primary">{rule.name}</h2>
        <div
          role="toolbar"
          aria-label={`${rule.name} の操作`}
          className="flex flex-wrap items-center gap-1"
        >
          <ActionButton icon="i-lucide-braces" label="CSS で編集" onClick={props.onShowCss} />
          <ActionButton icon="i-lucide-copy" label="複製" onClick={props.onDuplicate} />
          <ActionButton
            icon="i-lucide-bring-to-front"
            label="最前面へ"
            onClick={() => props.onReorder("front")}
          />
          <ActionButton
            icon="i-lucide-send-to-back"
            label="最背面へ"
            onClick={() => props.onReorder("back")}
          />
          <ActionButton icon="i-lucide-trash-2" label="削除" danger onClick={props.onRemove} />
        </div>
      </div>

      <NameField name={rule.name} otherNames={props.otherNames} onRename={props.onRename} />

      <TextTemplateField
        value={decodeCssString(value(textProperty) ?? "") ?? ""}
        fields={props.fields}
        onChange={text => props.onDeclaration(textProperty, encodeCssString(text))}
      />

      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        <CssValueField
          label="横位置 left"
          value={value("left")}
          placeholder="40mm"
          onChange={set("left")}
        />
        <CssValueField
          label="縦位置 top"
          value={value("top")}
          placeholder="30mm"
          onChange={set("top")}
        />
        <CssValueField
          label="幅 width"
          value={value("width")}
          placeholder="20mm"
          onChange={set("width")}
        />
        <CssValueField
          label="高さ height"
          value={value("height")}
          placeholder="100mm"
          onChange={set("height")}
        />
        <CssChoiceField
          label="向き"
          value={value("writing-mode")}
          options={[
            { value: "", label: "横書き" },
            { value: "vertical-rl", label: "縦書き" },
          ]}
          onChange={set("writing-mode")}
        />
        <CssChoiceField
          label="フォント"
          // 指定がなければ描画と同じく既定のフォント（明朝）を選んだ状態にする。
          value={value("font-family") ?? fontFamilyValue(defaultFont)}
          options={fontOptions}
          onChange={set("font-family")}
        />
        <CssValueField
          label="文字サイズ"
          value={value("font-size")}
          placeholder="14pt"
          onChange={set("font-size")}
        />
        <CssValueField
          label="行の高さ"
          value={value("line-height")}
          placeholder="1.5"
          onChange={set("line-height")}
        />
        <CssValueField
          label="文字の間隔"
          value={value("letter-spacing")}
          placeholder="0.1em"
          onChange={set("letter-spacing")}
        />
        <CssChoiceField
          label="縦中横"
          value={value("text-combine-upright")}
          options={[
            { value: "", label: "しない" },
            { value: "digits 2", label: "2桁までの数字" },
            { value: "digits 3", label: "3桁までの数字" },
            { value: "digits 4", label: "4桁までの数字" },
          ]}
          onChange={set("text-combine-upright")}
        />
        <CssChoiceField
          label="行の中の揃え"
          value={value("text-align")}
          options={[
            { value: "", label: "先頭" },
            { value: "center", label: "中央" },
            { value: "end", label: "末尾" },
            { value: "justify", label: "両端" },
          ]}
          onChange={set("text-align")}
        />
        <CssChoiceField
          label="枠の中の揃え"
          value={value("justify-content")}
          options={[
            { value: "", label: "先頭" },
            { value: "center", label: "中央" },
            { value: "flex-end", label: "末尾" },
          ]}
          onChange={set("justify-content")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={value(splitProperty) === "char"}
          onChange={event =>
            props.onDeclaration(splitProperty, event.currentTarget.checked ? "char" : undefined)
          }
        />
        1文字ずつ分ける（[data-part="char"] で1文字ずつ指定できます）
      </label>
    </div>
  );
}

/** 操作のボタン。danger は削除など、注意が必要な操作に使う。 */
function ActionButton(props: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`atehame-btn-secondary btn-sm px-2 font-normal ${props.danger ? "text-status-error" : ""}`}
      onClick={props.onClick}
    >
      <span className={`${props.icon} size-4`} aria-hidden="true" />
      {props.label}
    </button>
  );
}
