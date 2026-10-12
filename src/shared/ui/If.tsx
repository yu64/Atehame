import type { ReactNode } from "react";

export interface Props {
  /** 真なら children を表示する。 */
  value: unknown;
  children: ReactNode;
  /** space: 偽でも場所は空けておく（表示を切り替えても周りが動かない）。 */
  mode?: "space" | "none";
}

/** 条件に合うときだけ children を表示する。 */
export function If(props: Props) {
  const mode = props.mode ?? "none";

  if (mode === "space") {
    return (
      <div
        className={props.value ? "" : "opacity-0 pointer-events-none cursor-default select-none"}
      >
        {props.children}
      </div>
    );
  }

  return (props.value ? props.children : null);
}
