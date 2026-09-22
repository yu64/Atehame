import { Input } from "@src/components/Input";
import { Select } from "@src/components/Select";
import { If } from "@src/components/util/If";


export interface Props {
}


export default function SchemaCard(props: Props) {

  return (
    <div 
      className={`
        card w-full
        bg-surface
        border border-surface-border rounded-lg
        group
      `}
    >
      <div className={`
        card-body grid
        grid-cols-1
        md:grid-cols-[1fr_auto]
        lg:grid-cols-[3fr_auto_7fr]
        gap-y-0 gap-x-2 pt-4
      `}>
        <div className="">
          <Input
            type="text"
            label="カラム名"
          />
        </div>
        <div className="md:col-start-2">
          <Select
            label="データ型"
          >
            <option value="string">文字列 (String)</option>
            <option value="number">数値 (Number)</option>
            <option value="boolean">真偽値 (Boolean)</option>
            <option value="date">日時 (DateTime)</option>
          </Select>
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <Input
            type="text"
            label="メモ"
          />
        </div>
      </div>
    </div>
  )
}
