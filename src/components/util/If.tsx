
export interface Props
{
  value: any;
  children: React.ReactNode;
}

export function If(props: Props)
{
  return (
    props.value
    ? props.children
    : null
  )
}