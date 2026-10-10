import { fieldPlaceholder } from "@src/logic/layoutCss";
import { useEffect, useState } from "react";

export interface Props {
  value: string;
  /** 埋め込みのボタンに並べる値の名前。 */
  fields: string[];
  onChange: (text: string) => void;
}

/** 表示する文字の欄。{名前} で値を埋め込む。 */
export default function TextTemplateField(props: Props) {
  const [text, setText] = useState(props.value);
  useEffect(() => {
    if (text !== props.value) setText(props.value);
  }, [props.value]);

  const update = (next: string) => {
    setText(next);
    props.onChange(next);
  };

  return (
    <fieldset className="fieldset m-0 p-0 gap-1">
      <legend className="fieldset-legend m-0 pt-0 pb-1">表示する文字</legend>
      <textarea
        className="textarea w-full focus-within:atehame-focus"
        rows={3}
        value={text}
        onChange={event => update(event.currentTarget.value)}
      />
      <span className="label whitespace-normal">
        {"{カラム名}"} の部分に加工の出力の値が入ります。
      </span>
      {props.fields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {props.fields.map(key => (
            <button
              key={key}
              type="button"
              className="atehame-btn-secondary btn-xs font-normal"
              title={`${fieldPlaceholder(key)} を末尾に追加`}
              onClick={() => update(text + fieldPlaceholder(key))}
            >
              + {key}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
