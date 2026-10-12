export interface Props {
  label?: string;
  onClick?: () => void;
}

export function Divider(props: Props) {
  return (
    <div
      className={`
        w-full
        flex items-center justify-center
        ${props.onClick ? "hover:bg-base-hover" : ""}
        color-text-tertiary select-none
        before:content-empty before:grow before:h-[1px] before:bg-border before:mr-1
        after:content-empty after:grow after:h-[1px] after:bg-border after:ml-1
      `}
      onClick={props.onClick}
    >
      {props.label}
    </div>
  );
}
