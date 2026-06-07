

export interface Props {
  children: React.ReactNode;
}

export function PageFrame(props: Props) {

  return (
    <div className={`
      flex flex-col items-center
      min-h-screen h-screen
      w-full
      px-4 sm:px-6 lg:px-8
      bg-bg-base
      overflow-hidden
    `}>
      {props.children}
    </div>
  );
}