import { insertAt, moveAt, removeAt } from "@src/shared/lib/util/collection";
import { Button } from "@src/shared/ui/Button";
import { DropdownMenu } from "@src/shared/ui/DropdownMenu";
import type { Key, ReactNode } from "react";

// #############################################################################
// MARK: 型定義

export interface EditableListProps<T> {
  items: T[];
  getKey: (item: T) => Key;
  dataFactory: (index: number) => T;
  label: (item: T, index: number) => string;
  /** 入力内容とそのレスポンシブ配置は呼び出し側が担当する。 */
  children: (item: T, index: number) => ReactNode;
  onChange: (items: T[]) => void;
}

interface CardProps {
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
export function EditableList<T>(props: EditableListProps<T>) {
  /** index の位置に新しい項目を追加する。 */
  function addAt(index: number) {
    props.onChange(insertAt(props.items, index, props.dataFactory(index)));
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {props.items.map((item, index) => (
          <li key={props.getKey(item)} className="min-w-0">
            <Card
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
            </Card>
          </li>
        ))}
      </ul>
      <Button
        icon="i-lucide-plus"
        label={props.items.length === 0 ? "最初の項目を追加" : "項目を追加"}
        size="md"
        className="w-full"
        onClick={() => addAt(props.items.length)}
      />
    </div>
  );
}

// #############################################################################
// MARK: 内部部品

/** リスト専用のカード。内容の種類や入力欄の配置には依存しない。 */
function Card(props: CardProps) {
  return (
    <div
      className={`
      card w-full min-w-0
      bg-surface border border-surface-border rounded-lg
    `}
    >
      <div className="card-body min-w-0 gap-1 px-4 py-3">
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
              label="項目の操作"
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
      </div>
    </div>
  );
}
