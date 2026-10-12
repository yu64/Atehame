import type { ReactNode } from "react";

export interface RadioCardOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface Props<T extends string> {
  /** ラジオボタンのまとまりの名前（同じ画面で重ならないもの）。 */
  name: string;
  /** 見出し。 */
  legend: string;
  /** 見出しを表示せず、読み上げにだけ使う。 */
  hideLegend?: boolean;
  options: RadioCardOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
}

/** 枠付きのカードで選ぶラジオボタン。選んだカードは枠の色を変える。 */
export function RadioCardGroup<T extends string>(props: Props<T>) {
  return (
    <fieldset className="fieldset m-0 p-0 gap-2">
      <legend className={props.hideLegend ? "sr-only" : "fieldset-legend m-0 pt-0 pb-1"}>
        {props.legend}
      </legend>
      {props.options.map(option => {
        const selected = option.value === props.value;
        return (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3 rounded-lg border bg-surface
              ${selected ? "border-primary" : "border-surface-border"}
              ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <input
              type="radio"
              name={props.name}
              className="radio radio-sm mt-0.5"
              value={option.value}
              checked={selected}
              disabled={option.disabled}
              onChange={() => props.onChange(option.value)}
            />
            <span className="flex flex-col">
              <span className="font-bold text-text-primary">{option.label}</span>
              {option.description && (
                <span className="text-sm text-text-secondary">{option.description}</span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
