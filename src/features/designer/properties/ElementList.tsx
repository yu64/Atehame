import {
  decodeCssString,
  type ElementRule,
  imageProperty,
  textProperty,
} from "@src/features/designer/layoutCss";
import { Button } from "@src/shared/ui/Button";

// #############################################################################
// MARK: 型定義

export interface Props {
  elements: ElementRule[];
  selected: string | undefined;
  onSelect: (name: string) => void;
  onRemove: (name: string) => void;
}

// #############################################################################
// MARK: コンポーネント

/** 部品の一覧。前面の部品（CSS で後ろに書かれた部品）を上に並べる。 */
export function ElementList(props: Props) {
  const elements = [...props.elements].reverse();

  if (elements.length === 0) {
    return (
      <p className="p-3 text-sm text-text-secondary">
        部品がありません。左のパレットから追加するか、CSS に [data-name="名前"]
        の規則を書いてください。
      </p>
    );
  }

  return (
    <ul aria-label="部品の一覧" className="flex flex-col gap-1 p-2">
      {elements.map(element => {
        const selected = element.name === props.selected;
        const image = element.declarations.get(imageProperty)?.value;
        const text = (
          (image !== undefined)
          ? `画像: ${decodeCssString(image) ?? ""}`
          : (decodeCssString(element.declarations.get(textProperty)?.value ?? "") ?? "")
        );

        return (
          <li
            key={element.name}
            className={`
              flex items-center gap-1 rounded-lg border
              ${selected ? "border-primary bg-surface-hover" : "border-transparent hover:bg-surface-hover"}
            `}
          >
            <button
              type="button"
              aria-current={selected ? "true" : undefined}
              className="flex flex-1 min-w-0 flex-col px-2 py-1.5 text-left cursor-pointer"
              onClick={() => props.onSelect(element.name)}
            >
              <span className="truncate text-sm text-text-primary">{element.name}</span>
              <span className="truncate text-xs text-text-tertiary">{text || "（文字なし）"}</span>
            </button>
            <Button
              icon="i-lucide-trash-2"
              label={`${element.name} を削除`}
              iconOnly
              danger
              className="shrink-0"
              onClick={() => props.onRemove(element.name)}
            />
          </li>
        );
      })}
    </ul>
  );
}
