import {
  decodeCssString,
  type ElementRule,
  encodeCssString,
  imageProperty,
  splitProperty,
  textProperty,
} from "@src/features/designer/layoutCss";
import { CssChoiceField } from "@src/features/designer/properties/CssChoiceField";
import { CssValueField } from "@src/features/designer/properties/CssValueField";
import { NameField } from "@src/features/designer/properties/NameField";
import { TextTemplateField } from "@src/features/designer/properties/TextTemplateField";
import { defaultFont, fontFamilyValue, fontVariables } from "@src/features/designer/render";
import { keysOf } from "@src/shared/lib/util/object";
import { Button } from "@src/shared/ui/Button";

// #############################################################################
// MARK: 型定義

export interface Props {
  rule: ElementRule;
  /** ほかの部品の名前（重複の確認用）。 */
  otherNames: string[];
  fields: string[];
  /** 登録済みの画像の名前（画像の部品で選ぶ）。 */
  assetNames: string[];
  /** 宣言を設定する。value が undefined なら取り除く。 */
  onDeclaration: (property: string, value: string | undefined) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onReorder: (to: "front" | "back") => void;
  onShowCss: () => void;
}

type ValueOf = (property: string) => string | undefined;

type SetterOf = (property: string) => (next: string | undefined) => void;

// #############################################################################
// MARK: 定数

const fontOptions = keysOf(fontVariables).map(key => ({
  value: fontFamilyValue(key),
  label: fontVariables[key].label,
}));

// #############################################################################
// MARK: コンポーネント

/**
 * 部品の設定。値はすべて部品の CSS の規則（[data-name="名前"]）を読み書きする。
 * ここにない設定は CSS タブで直接書く。
 */
export function ElementProperties(props: Props) {
  const { rule } = props;
  /** 部品に書かれた宣言の値。 */
  function value(property: string) {
    return rule.declarations.get(property)?.value;
  }
  /** 宣言を書き換える関数（入力欄の onChange に渡す）。 */
  function set(property: string) {
    return (next: string | undefined) => props.onDeclaration(property, next);
  }
  const isImage = value(imageProperty) !== undefined;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex flex-col gap-2">
        <h2 className="min-w-0 truncate font-bold text-text-primary">{rule.name}</h2>
        <div
          role="toolbar"
          aria-label={`${rule.name} の操作`}
          className="flex flex-wrap items-center gap-1"
        >
          <Button icon="i-lucide-braces" label="CSS で編集" onClick={props.onShowCss} />
          <Button icon="i-lucide-copy" label="複製" onClick={props.onDuplicate} />
          <Button
            icon="i-lucide-bring-to-front"
            label="最前面へ"
            onClick={() => props.onReorder("front")}
          />
          <Button
            icon="i-lucide-send-to-back"
            label="最背面へ"
            onClick={() => props.onReorder("back")}
          />
          <Button icon="i-lucide-trash-2" label="削除" danger onClick={props.onRemove} />
        </div>
      </div>

      <NameField name={rule.name} otherNames={props.otherNames} onRename={props.onRename} />

      {!isImage && (
        <TextTemplateField
          value={decodeCssString(value(textProperty) ?? "") ?? ""}
          fields={props.fields}
          onChange={text => props.onDeclaration(textProperty, encodeCssString(text))}
        />
      )}

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
      </div>

      {(
        isImage
        ? <ImageFields value={value} set={set} assetNames={props.assetNames} />
        : <TextFields value={value} set={set} onDeclaration={props.onDeclaration} />
      )}
    </div>
  );
}

// #############################################################################
// MARK: 内部部品

/** 画像の部品の設定。合わせ方と位置は、中の画像が部品の規則から受け継ぐ。 */
function ImageFields(props: { value: ValueOf; set: SetterOf; assetNames: string[] }) {
  const { value, set } = props;
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
      <div className="col-span-2">
        <CssChoiceField
          label="画像"
          value={value(imageProperty)}
          options={props.assetNames.map(name => ({
            value: encodeCssString(name),
            label: name,
          }))}
          onChange={next => next !== undefined && set(imageProperty)(next)}
        />
      </div>
      <CssChoiceField
        label="合わせ方"
        value={value("object-fit")}
        options={[
          {
            value: "contain",
            label: "全体を収める",
          },
          {
            value: "cover",
            label: "枠を埋める",
          },
          {
            value: "",
            label: "引き伸ばす",
          },
        ]}
        onChange={set("object-fit")}
      />
      <CssChoiceField
        label="位置"
        value={value("object-position")}
        options={[
          {
            value: "",
            label: "中央",
          },
          {
            value: "top",
            label: "上",
          },
          {
            value: "bottom",
            label: "下",
          },
          {
            value: "left",
            label: "左",
          },
          {
            value: "right",
            label: "右",
          },
        ]}
        onChange={set("object-position")}
      />
    </div>
  );
}

/** 文字の部品の設定。 */
function TextFields(props: {
  value: ValueOf;
  set: SetterOf;
  onDeclaration: Props["onDeclaration"];
}) {
  const { value, set } = props;
  return (
    <>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        <CssChoiceField
          label="向き"
          value={value("writing-mode")}
          options={[
            {
              value: "",
              label: "横書き",
            },
            {
              value: "vertical-rl",
              label: "縦書き",
            },
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
            {
              value: "",
              label: "しない",
            },
            {
              value: "digits 2",
              label: "2桁までの数字",
            },
            {
              value: "digits 3",
              label: "3桁までの数字",
            },
            {
              value: "digits 4",
              label: "4桁までの数字",
            },
          ]}
          onChange={set("text-combine-upright")}
        />
        <CssChoiceField
          label="行の中の揃え"
          value={value("text-align")}
          options={[
            {
              value: "",
              label: "先頭",
            },
            {
              value: "center",
              label: "中央",
            },
            {
              value: "end",
              label: "末尾",
            },
            {
              value: "justify",
              label: "両端",
            },
          ]}
          onChange={set("text-align")}
        />
        <CssChoiceField
          label="枠の中の揃え"
          value={value("justify-content")}
          options={[
            {
              value: "",
              label: "先頭",
            },
            {
              value: "center",
              label: "中央",
            },
            {
              value: "flex-end",
              label: "末尾",
            },
          ]}
          onChange={set("justify-content")}
        />
      </div>

      <CssChoiceField
        label="文字の分け方"
        value={value(splitProperty)}
        options={[
          {
            value: "",
            label: "分けない",
          },
          {
            value: "char",
            label: '1文字ずつ（[data-part="char"] で指定）',
          },
          {
            value: "line",
            label: '1行ずつ（[data-part="line"] で指定）',
          },
        ]}
        onChange={set(splitProperty)}
      />
    </>
  );
}
