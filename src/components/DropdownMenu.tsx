import { useEffect, useRef, type ReactNode } from "react";

export interface DropdownMenuItem {
  id: string;
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

export interface Props {
  label: string;
  trigger?: ReactNode;
  items: DropdownMenuItem[];
}

export default function DropdownMenu(props: Props) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        menuRef.current?.removeAttribute("open");
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  function closeAndFocusTrigger() {
    menuRef.current?.removeAttribute("open");
    menuRef.current?.querySelector("summary")?.focus();
  }

  return (
    <details
      ref={menuRef}
      className="relative"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          event.currentTarget.removeAttribute("open");
        }
      }}
      onKeyDown={event => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          closeAndFocusTrigger();
        }
      }}
    >
      <summary
        className={`
          atehame-btn-secondary
          list-none [&::-webkit-details-marker]:hidden
        `}
        aria-label={props.label}
        title={props.label}
      >
        {props.trigger ?? <span className="i-lucide-ellipsis size-6 shrink-0" aria-hidden="true" />}
      </summary>
      <div
        className={`
        absolute right-0 top-full z-20
        mt-1 w-44 p-1
        rounded-lg border border-surface-border
        bg-surface shadow-lg
        flex flex-col
      `}
      >
        {props.items.map(item => (
          <button
            key={item.id}
            type="button"
            className="atehame-btn-secondary justify-start"
            disabled={item.disabled}
            onClick={() => {
              closeAndFocusTrigger();
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}
