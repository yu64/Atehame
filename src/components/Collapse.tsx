
export interface Props {
  title: string;
  children: React.ReactNode;
}


export default function Collapse(props: Props) {

  return (
    <details
      className={`
        collapse collapse-arrow 
        bg-surface
        border border-surface-border rounded-lg
        focus-visible:atehame-focus
        has-focus-visible:atehame-focus
      `}
      style={{ visibility: 'visible' }}
    >
      <summary className={`
        collapse-title
        font-semibold
        after:start-5 after:end-auto 
        pe-4 ps-12 list-none
        outline-none
      `}>
        {props.title}
      </summary>
      <div className="collapse-content text-sm">
        {props.children}
      </div>
    </details>
  )
}
