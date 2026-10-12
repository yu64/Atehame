import { type FieldType, fieldTypeLabels, type SchemaField } from "@src/features/template";
import { Input } from "@src/shared/ui/Input";
import { Select } from "@src/shared/ui/Select";

// #############################################################################
// MARK: 型定義

export interface Props {
  value: SchemaField;
  onChange: (value: SchemaField) => void;
}

// #############################################################################
// MARK: コンポーネント

/** カラム1つの設定（名前・データ型・メモ）。 */
export function SchemaFieldEditor(props: Props) {
  return (
    <div
      className={`
        grid min-w-0
        grid-cols-1
        md:grid-cols-[1fr_auto]
        lg:grid-cols-[3fr_auto_7fr]
        gap-y-3 gap-x-2
      `}
    >
      <div className="">
        <Input
          type="text"
          label="カラム名"
          value={props.value.name}
          onChange={event =>
            props.onChange({
              ...props.value,
              name: event.currentTarget.value,
            })
          }
        />
      </div>
      <div className="md:col-start-2">
        <Select
          label="データ型"
          value={props.value.type}
          onChange={event =>
            props.onChange({
              ...props.value,
              type: event.currentTarget.value as FieldType,
            })
          }
        >
          {Object.entries(fieldTypeLabels).map(([type, label]) => (
            <option key={type} value={type}>
              {label.name} ({label.english})
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2 lg:col-span-1">
        <Input
          type="text"
          label="メモ"
          value={props.value.memo}
          onChange={event =>
            props.onChange({
              ...props.value,
              memo: event.currentTarget.value,
            })
          }
        />
      </div>
    </div>
  );
}
