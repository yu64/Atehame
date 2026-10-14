import type { ReactNode } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  children: ReactNode;
}

// #############################################################################
// MARK: コンポーネント

/** 画面全体の枠。ヘッダーと本文を縦に並べる。 */
export function PageFrame(props: Props) {
  return (
    <div
      className={`
      flex flex-col items-center
      h-dvh
      w-full
      bg-base
      overflow-hidden
    `}
    >
      {props.children}
    </div>
  );
}
