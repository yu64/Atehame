import { If } from "@src/shared/ui/If";

export interface Props {
  title?: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
}

export default function SelectCard(props: Props) {
  return (
    <div
      className={`
        card w-full
        bg-surface hover:bg-surface-hover
        border border-surface-border rounded-lg
        group
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
            <button className="atehame-btn-primary group-hover:bg-primary-hover">
              {props.buttonText}
            </button>
          </div>
        </If>
      </div>
    </div>
  );
}
