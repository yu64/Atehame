import { insertAt, moveAt, removeAt } from "@src/logic/util/CollectionUtil";
import type { ReactNode, Key } from "react";
import DropdownMenu from "@src/components/DropdownMenu";

export interface EditableListProps<T> {
  items: T[];
  getKey: (item: T) => Key;
  dataFactory: (index: number) => T;
  label: (item: T, index: number) => string;
  /** 入力内容とそのレスポンシブ配置は呼び出し側が担当する。 */
  children: (item: T, index: number) => ReactNode;
  onChange: (items: T[]) => void;
}

export default function EditableList<T>(props: EditableListProps<T>) {
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
      <button
        type="button"
        className="atehame-btn-secondary w-full"
        onClick={() => addAt(props.items.length)}
      >
        <span className="i-lucide-plus size-6 shrink-0" aria-hidden="true" />
        {props.items.length === 0 ? "最初の項目を追加" : "項目を追加"}
      </button>
    </div>
  );
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
            <button
              type="button"
              className="atehame-btn-secondary btn-square p-0"
              aria-label="上へ移動"
              title="上へ移動"
              disabled={props.first}
              onClick={props.onPrev}
            >
              <span className="i-lucide-arrow-up size-6 shrink-0" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="atehame-btn-secondary btn-square p-0"
              aria-label="下へ移動"
              title="下へ移動"
              disabled={props.last}
              onClick={props.onNext}
            >
              <span className="i-lucide-arrow-down size-6 shrink-0" aria-hidden="true" />
            </button>
            <DropdownMenu
              label="項目の操作"
              items={[
                { id: "add-before", label: "この上に追加", onSelect: props.onAddBefore },
                { id: "add-after", label: "この下に追加", onSelect: props.onAddAfter },
              ]}
            />
            <button
              type="button"
              className="atehame-btn-secondary btn-square p-0"
              aria-label="削除"
              title="削除"
              onClick={props.onRemove}
            >
              <span className="i-lucide-trash-2 size-6 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="min-w-0">{props.children}</div>
      </div>
    </div>
  );
}
