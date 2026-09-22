
export interface Props
{
  value: any;
  children: React.ReactNode;
  mode?: ("space" | "none")
}

export function If(props: Props)
{
  const mode = props.mode ?? "none";

  if(mode == "space")
  {
    return (
      <div className={(
        props.value
        ? ""
        : "opacity-0 pointer-events-none cursor-default select-none"
      )}>
        {props.children}
      </div>
    )
  }

  return (
    props.value
    ? props.children
    : null
  )
}