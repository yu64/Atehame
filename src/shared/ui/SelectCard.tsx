import { If } from "@src/shared/ui/If";

// #############################################################################
// MARK: 型定義

export interface Props {
  title?: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
}

// #############################################################################
// MARK: コンポーネント

/** 見出し・説明・ボタンを持つ、選ぶためのカード。 */
export function SelectCard(props: Props) {
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
