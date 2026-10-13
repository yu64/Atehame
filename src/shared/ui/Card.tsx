import type { MouseEvent, ReactNode } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  /**
   * 要素の種類。一覧の項目なら "li"、見出しを持つまとまりなら "section"、
   * 中の入力欄（ラジオボタンなど）を全体で押せるようにするなら "label"。既定は "div"。
   */
  as?: "div" | "section" | "li" | "label";
  /** 枠の見せ方。"ghost" は、選ばれるまで枠も背景も出さない（項目が詰まって並ぶ一覧に使う）。既定は "outline"。 */
  frame?: "outline" | "ghost";
  /** 選ばれているとき。枠の色を変える。 */
  selected?: boolean;
  /** 角の丸み。既定は "lg"。 */
  rounded?: "none" | "md" | "lg";
  /** 内側の余白。既定は "md"。 */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * カード全体を押したとき。渡すと、押せる見た目（ホバー・カーソル）になる。
   * キーボードでは押せないため、同じ操作のボタンを中に置く。
   */
  onClickCard?: () => void;
  className?: string;
  children: ReactNode;
}

// #############################################################################
// MARK: 定数

const roundedClasses = {
  none: "",
  md: "rounded-md",
  lg: "rounded-lg",
};

const paddingClasses = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-6",
};

/** 自分で押す操作を持つ部品。この中を押したときは、カード全体の操作にしない。 */
const interactiveSelector = "a, button, input, select, textarea, label, summary, [contenteditable]";

// #############################################################################
// MARK: コンポーネント

/**
 * 枠で囲んだまとまり。中身の並べ方は、使う側が className で決める。
 *
 * onClickCard を渡すと、カード全体を押せる。中のボタンや入力欄を押したときは、その部品の操作だけが
 * 動き、カード全体の操作は動かない（二重に動かさない）。中に置いたダイアログの中を押したときも同じ。
 * 押せるカードには group が付くので、中の部品は group-hover: でカードのホバーに合わせられる。
 */
export function Card(props: Props) {
  const Tag = props.as ?? "div";
  const clickable = props.onClickCard !== undefined;
  const ghost = props.frame === "ghost";

  /** 中の部品の操作でなければ、カード全体の操作にする。 */
  function clickCard(event: MouseEvent<HTMLElement>) {
    const card = event.currentTarget;
    const target = event.target;
    // 中に置いたダイアログは別の場所に描かれるが、クリックはここまで届く。
    if (!(target instanceof Element) || !card.contains(target)) return;
    const inner = target.closest(interactiveSelector);
    if (inner && inner !== card && card.contains(inner)) return;
    props.onClickCard?.();
  }

  return (
    <Tag
      className={`
        border
        ${props.selected ? "border-primary" : (ghost ? "border-transparent" : "border-surface-border")}
        ${ghost ? (props.selected ? "bg-surface-hover" : "") : "bg-surface"}
        ${roundedClasses[props.rounded ?? "lg"]}
        ${paddingClasses[props.padding ?? "md"]}
        ${clickable ? "group cursor-pointer hover:bg-surface-hover" : ""}
        ${props.className ?? ""}
      `}
      onClick={clickable ? clickCard : undefined}
    >
      {props.children}
    </Tag>
  );
}
