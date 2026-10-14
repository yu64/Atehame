import { insertAt, moveAt, removeAt } from "@src/shared/lib/util/collection";
import { Button } from "@src/shared/ui/Button";
import { Card } from "@src/shared/ui/Card";
import { DropdownMenu } from "@src/shared/ui/DropdownMenu";
import type { Key, ReactNode } from "react";

// #############################################################################
// MARK: 型定義

export interface Props<T> {
  /** 項目の呼び名（ボタンの文言に使う）。既定は「項目」。 */
  itemName?: string;
  items: T[];
  getKey: (item: T) => Key;
  dataFactory: (index: number) => T;
  label: (item: T, index: number) => string;
  /** 入力内容とそのレスポンシブ配置は呼び出し側が担当する。 */
  children: (item: T, index: number) => ReactNode;
  onChange: (items: T[]) => void;
}

interface ItemProps {
  /** 項目の呼び名。 */
  itemName: string;
  label: string;
  first: boolean;
  last: boolean;
  children: ReactNode;
  onPrev: () => void;
  onNext: () => void;
  onAddBefore: () => void;
  onAddAfter: () => void;
  onRemove: () => void;
}

// #############################################################################
// MARK: コンポーネント

/** 項目を追加・削除・並べ替えできる一覧。項目の中身は children で描く。 */
export function EditableList<T>(props: Props<T>) {
  const itemName = props.itemName ?? "項目";

  /** index の位置に新しい項目を追加する。 */
  function addAt(index: number) {
    props.onChange(insertAt(props.items, index, props.dataFactory(index)));
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {props.items.map((item, index) => (
          <Item
            key={props.getKey(item)}
            itemName={itemName}
            label={props.label(item, index)}
            first={index === 0}
            last={index === props.items.length - 1}
            onPrev={() => props.onChange(moveAt(props.items, index, index - 1))}
            onNext={() => props.onChange(moveAt(props.items, index, index + 1))}
            onAddBefore={() => addAt(index)}
            onAddAfter={() => addAt(index + 1)}
            onRemove={() => props.onChange(removeAt(props.items, index))}
          >
            {props.children(item, index)}
          </Item>
        ))}
      </ul>
      <Button
        icon="i-lucide-plus"
        label={props.items.length === 0 ? `最初の${itemName}を追加` : `${itemName}を追加`}
        size="md"
        className="w-full"
        onClick={() => addAt(props.items.length)}
      />
    </div>
  );
}

// #############################################################################
// MARK: 内部部品

/** 一覧の項目。見出しと操作のボタンの下に、中身を置く。内容の種類や入力欄の配置には依存しない。 */
function Item(props: ItemProps) {
  return (
    <Card as="li" className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 break-words text-text-secondary">{props.label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            icon="i-lucide-arrow-up"
            label="上へ移動"
            iconOnly
            size="md"
            disabled={props.first}
            onClick={props.onPrev}
          />
          <Button
            icon="i-lucide-arrow-down"
            label="下へ移動"
            iconOnly
            size="md"
            disabled={props.last}
            onClick={props.onNext}
          />
          <DropdownMenu
            label={`${props.itemName}の操作`}
            items={[
              {
                id: "add-before",
                label: "この上に追加",
                onSelect: props.onAddBefore,
              },
              {
                id: "add-after",
                label: "この下に追加",
                onSelect: props.onAddAfter,
              },
            ]}
          />
          <Button
            icon="i-lucide-trash-2"
            label="削除"
            iconOnly
            danger
            size="md"
            onClick={props.onRemove}
          />
        </div>
      </div>
      <div className="min-w-0">{props.children}</div>
    </Card>
  );
}
