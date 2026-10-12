import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface Props extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  /** 操作の名前。iconOnly のときは、ツールチップと読み上げに使う。 */
  label: ReactNode;
  /** lucide のアイコンのクラス名。 */
  icon?: string;
  /** アイコンだけを表示する。label は文字列にする。 */
  iconOnly?: boolean;
  /** primary は画面の主な操作（次へ・保存など）。既定は secondary。 */
  variant?: "primary" | "secondary";
  /** 削除など、注意が必要な操作。 */
  danger?: boolean;
  size?: "sm" | "md";
}

const iconSizes = { sm: "size-4", md: "size-5" };

/**
 * ボタン。見た目は variant・size・danger で選ぶ。
 * そのほかの属性（disabled・aria-*・tabIndex など）は、そのまま button に渡す。
 */
export function Button(props: Props) {
  const { label, icon, iconOnly, variant, danger, size = "sm", className, ...buttonProps } = props;
  const text = (typeof label === "string" ? label : undefined);

  return (
    <button
      type="button"
      aria-label={iconOnly ? text : undefined}
      title={iconOnly ? text : undefined}
      {...buttonProps}
      className={`
        ${variant === "primary" ? "atehame-btn-primary" : "atehame-btn-secondary"}
        ${size === "sm" ? "btn-sm" : ""}
        ${iconOnly ? "btn-square p-0" : (size === "sm" ? "px-2 font-normal" : "")}
        ${danger ? "text-status-error" : ""}
        ${className ?? ""}
      `}
    >
      {icon && <span className={`${icon} ${iconSizes[size]} shrink-0`} aria-hidden="true" />}
      {!iconOnly && label}
    </button>
  );
}
