import { Button } from "@src/shared/ui/Button";
import { Card, type Props as CardProps } from "@src/shared/ui/Card";

// #############################################################################
// MARK: 型定義

export interface Props {
  title: string;
  description?: string;
  buttonText: string;
  /** カードのどこを押しても、ボタンを押しても呼ばれる。 */
  onClick: () => void;
  /** 選べないとき。文字を薄くし、押せなくする。 */
  disabled?: boolean;
  /** "sm" は横並びで小さく（ダイアログの中など）、"md" は縦並びで大きく（画面の主な選択）。既定は "md"。 */
  size?: "sm" | "md";
  /** 見出しの段。置く場所の見出しの段に合わせる。既定は "h2"。 */
  heading?: "h2" | "h3";
  /** 角の丸み。 */
  rounded?: CardProps["rounded"];
}

// #############################################################################
// MARK: コンポーネント

/** 見出し・説明・ボタンを持つ、選ぶためのカード。カード全体を押せる。 */
export function SelectCard(props: Props) {
  const small = props.size === "sm";
  const Heading = props.heading ?? "h2";

  return (
    <Card
      as="section"
      rounded={props.rounded}
      padding={small ? "md" : "lg"}
      className={`w-full flex ${small ? "items-center gap-3" : "flex-col gap-2"}`}
      onClickCard={props.disabled ? undefined : props.onClick}
    >
      <div className={`flex flex-1 flex-col ${small ? "" : "gap-2"}`}>
        <Heading
          className={`
            font-bold
            ${small ? "" : "text-lg"}
            ${props.disabled ? "text-text-tertiary" : "text-text-primary"}
          `}
        >
          {props.title}
        </Heading>
        {props.description && (
          <p
            className={`
              ${small ? "text-sm" : ""}
              ${props.disabled ? "text-text-tertiary" : (small ? "text-text-secondary" : "text-text-primary")}
            `}
          >
            {props.description}
          </p>
        )}
      </div>
      <Button
        label={props.buttonText}
        variant="primary"
        size={small ? "sm" : "md"}
        disabled={props.disabled}
        className={`group-hover:bg-primary-hover ${small ? "" : "self-end"}`}
        onClick={props.onClick}
      />
    </Card>
  );
}
