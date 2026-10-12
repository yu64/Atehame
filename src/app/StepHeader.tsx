import { Button } from "@src/shared/ui/Button";

export interface Props {
  title: string;
  description?: React.ReactNode;
  /** 未指定の場合も、ページ間で位置を揃えるため戻るボタンの領域を確保する。 */
  onBack?: () => void;
  onNext?: () => void;
}

/** 編集の各段階の見出しと、前後の段階へ移動するボタン。 */
export function StepHeader(props: Props) {
  return (
    <section
      className={`
        flex flex-wrap items-center gap-4
        shrink-0 w-full px-4 sm:px-6 lg:px-8 py-3
        border-b border-surface-border
      `}
    >
      <Button
        icon="i-lucide-chevron-left"
        label="戻る"
        size="md"
        className={`pl-2 pr-4 ${props.onBack ? "" : "invisible"}`}
        aria-hidden={props.onBack ? undefined : true}
        tabIndex={props.onBack ? undefined : -1}
        onClick={props.onBack}
      />
      {/* 狭い画面では説明を1段目、操作ボタンを2段目に置く。 */}
      <div className="min-w-0 basis-full order-first sm:basis-auto sm:order-none sm:flex-1">
        <h1 className="text-lg font-bold text-text-primary">{props.title}</h1>
        {props.description && <p className="text-sm text-text-secondary">{props.description}</p>}
      </div>
      {props.onNext && (
        <Button
          label="次へ"
          variant="primary"
          size="md"
          className="ml-auto"
          onClick={props.onNext}
        />
      )}
    </section>
  );
}
