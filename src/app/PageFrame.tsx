export interface Props {
  children: React.ReactNode;
}

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
