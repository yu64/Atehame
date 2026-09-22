

export interface Props {
  children?: React.ReactNode
}


export default function MainContent(props: Props) {

  return (
    <main className={`
      grow
      w-full
      md:min-w-4xl
    `}>
      {props.children}
    </main>
  )
}