/** 部品を削除するゴミ箱ボタン。 */
export function RemoveButton(props: { name: string; onClick: () => void; className?: string }) {
  const label = `${props.name} を削除`;
  return (
    <button
      type="button"
      className={`atehame-btn-secondary btn-sm btn-square p-0 shrink-0 text-status-error ${props.className ?? ""}`}
      aria-label={label}
      title={label}
      onClick={() => props.onClick()}
    >
      <span className="i-lucide-trash-2 size-4" aria-hidden="true" />
    </button>
  );
}
