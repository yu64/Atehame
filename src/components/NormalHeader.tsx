import Logo from "@src/components/Logo";


export interface Props {
}


export default function NormalHeader(props: Props) {

  return (
    <header className={`
      flex flex-row
      text-primary
      border-b-2 border-primary
      sticky top-0 z-50
      h-16 w-full
    `}>
      <div className="flex items-center space-x-3">
        <Logo/>
        <span className="text-2xl font-black tracking-tighter text-primary uppercase">Atehame</span>
      </div>
    </header>
  )
}