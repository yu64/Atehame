import { fieldPlaceholder } from "@src/features/designer/layoutCss";
import { useSyncedText } from "@src/shared/hooks/useSyncedText";
import { Button } from "@src/shared/ui/Button";
import { Textarea } from "@src/shared/ui/Textarea";

// #############################################################################
// MARK: 型定義

export interface Props {
  value: string;
  /** 埋め込みのボタンに並べる値の名前。 */
  fields: string[];
  onChange: (text: string) => void;
}

// #############################################################################
// MARK: コンポーネント

/** 表示する文字の欄。{名前} で値を埋め込む。 */
export function TextTemplateField(props: Props) {
  const [text, setText] = useSyncedText(props.value);

  /** 入力を反映し、変わっていれば知らせる。 */
  function update(next: string) {
    setText(next);
    props.onChange(next);
  }

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        label="表示する文字"
        description={<>{"{カラム名}"} の部分に加工の出力の値が入ります。</>}
        rows={3}
        value={text}
        onChange={event => update(event.currentTarget.value)}
      />
      {props.fields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {props.fields.map(key => (
            <Button
              key={key}
              label={`+ ${key}`}
              title={`${fieldPlaceholder(key)} を末尾に追加`}
              onClick={() => update(text + fieldPlaceholder(key))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
