import { Input } from "@src/components/Input";
import { useEffect, useState } from "react";

export interface Props {
  name: string;
  /** ほかの部品の名前（重複の確認用）。 */
  otherNames: string[];
  /** 確定できる名前になったときだけ呼ぶ。 */
  onRename: (name: string) => void;
}

/** 名前の欄。空や重複する名前は確定せず、理由を表示する。 */
export default function NameField(props: Props) {
  const [text, setText] = useState(props.name);
  useEffect(() => setText(props.name), [props.name]);

  const trimmed = text.trim();
  const error =
    trimmed === ""
      ? "名前を入力してください。"
      : props.otherNames.includes(trimmed)
        ? "同じ名前の部品があります。"
        : undefined;

  return (
    <Input
      type="text"
      label="名前"
      value={text}
      error={error}
      description={
        'CSS では [data-name="名前"] で指定します。変えると CSS のセレクタも書き換わります。'
      }
      onChange={event => {
        const next = event.currentTarget.value;
        setText(next);
        const name = next.trim();
        if (name !== "" && name !== props.name && !props.otherNames.includes(name))
          props.onRename(name);
      }}
    />
  );
}
