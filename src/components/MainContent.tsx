export interface Props {
  children?: React.ReactNode;
  /** 通常ページは外側でスクロール、エディターは内部でスクロールを管理する。 */
  mode?: "scroll" | "canvas";
  width?: "full" | "contained";
}

export default function MainContent(props: Props) {
  const canvas = props.mode === "canvas";

  return (
    <main
      className={`
      flex-1 min-h-0 min-w-0 w-full
      ${canvas ? "overflow-hidden" : "overflow-auto"}
    `}
    >
      <div
        className={`
        w-full min-w-0 mx-auto
        ${props.width === "contained" ? "max-w-7xl" : ""}
        ${canvas ? "h-full" : "min-h-full px-4 sm:px-6 lg:px-8 pb-4"}
      `}
      >
        {props.children}
      </div>
    </main>
  );
}
