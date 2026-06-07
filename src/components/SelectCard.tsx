import { If } from "@src/components/util/If";

export interface Props {
  title?: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
}

export function SelectCard(props: Props) {

  return (
    <div 
      className={`
        card w-full
        bg-light-100 hover:bg-light-400
        border border-border-subtle rounded-lg
      `}
      onClick={props.onClick}
    >
      <div className="card-body">
        <If value={props.title}>
          <h2 className="card-title text-lg text-text-primary">{props.title}</h2>
        </If>
        <If value={props.description}>
          <p className="text-text-primary">{props.description}</p>
        </If>
        <If value={props.buttonText}>
          <div className="card-actions justify-end">
            <button className="atehame-btn" onClick={props.onClick}>{props.buttonText}</button>
          </div>
        </If>
      </div>
    </div>
  )
}