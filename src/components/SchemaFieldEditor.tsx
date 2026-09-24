import { Input } from "@src/components/Input";
import { Select } from "@src/components/Select";
import type { FieldType, SchemaField } from "@src/models/DataSchema";


export interface Props {
  value: SchemaField;
  onChange: (value: SchemaField) => void;
}


export default function SchemaFieldEditor(props: Props) {

  return (
      <div className={`
        grid min-w-0
        grid-cols-1
        md:grid-cols-[1fr_auto]
        lg:grid-cols-[3fr_auto_7fr]
        gap-y-3 gap-x-2
      `}>
        <div className="">
          <Input
            type="text"
            label="カラム名"
            value={props.value.name}
            onChange={event => props.onChange({ ...props.value, name: event.currentTarget.value })}
          />
        </div>
        <div className="md:col-start-2">
          <Select
            label="データ型"
            value={props.value.type}
            onChange={event => props.onChange({ ...props.value, type: event.currentTarget.value as FieldType })}
          >
            <option value="string">文字列 (String)</option>
            <option value="number">数値 (Number)</option>
            <option value="boolean">真偽値 (Boolean)</option>
            <option value="datetime">日時 (DateTime)</option>
          </Select>
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <Input
            type="text"
            label="メモ"
            value={props.value.memo}
            onChange={event => props.onChange({ ...props.value, memo: event.currentTarget.value })}
          />
        </div>
      </div>
  )
}
