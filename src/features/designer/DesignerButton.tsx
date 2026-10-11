export interface Props {
  /** lucide のアイコンのクラス名。 */
  icon: string;
  label: string;
  /** アイコンだけを表示する。label はツールチップと読み上げに使う。 */
  iconOnly?: boolean;
  /** 削除など、注意が必要な操作。 */
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}

/** デザイナーの中で使うボタン。操作バー・設定欄・一覧で見た目をそろえる。 */
export default function DesignerButton(props: Props) {
  return (
    <button
      type="button"
      className={`
        atehame-btn-secondary btn-sm font-normal
        ${props.iconOnly ? "btn-square p-0" : "px-2"}
        ${props.danger ? "text-status-error" : ""}
        ${props.className ?? ""}
      `}
      aria-label={props.iconOnly ? props.label : undefined}
      title={props.iconOnly ? props.label : undefined}
      disabled={props.disabled}
      onClick={() => props.onClick()}
    >
      <span className={`${props.icon} size-4 shrink-0`} aria-hidden="true" />
      {!props.iconOnly && props.label}
    </button>
  );
}
