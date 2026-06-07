

export interface Props
{
  children?: React.ReactNode[];
}

export function StepHeader(props: Props)
{
  return <div>

    <div className={`
      flex flex-row
    `}>
      {props.children}      
    </div>

  </div>
}