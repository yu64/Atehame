import { useRef } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  /** 区切りの右にある欄の幅（px）。 */
  width: number;
  min: number;
  /** 現在の最大幅（px）。周りの広さで変わるため、操作のたびに求める。 */
  max: () => number;
  /** ダブルクリックで戻す幅（px）。 */
  defaultWidth: number;
  onResize: (width: number) => void;
  label: string;
}

// #############################################################################
// MARK: 定数

/** キーボードで1回に動かす幅（px）。 */
const keyStep = 16;

// #############################################################################
// MARK: コンポーネント

/**
 * 右の欄の左端に置く区切り。ドラッグで欄の幅を変える（左へ動かすと広がる）。
 * 欄の要素は position: relative にしておくこと。
 */
export function PaneResizer(props: Props) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  /** 幅を最小と最大の間に収める。 */
  function clamp(width: number) {
    return Math.round(Math.max(props.min, Math.min(Math.max(props.min, props.max()), width)));
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={props.label}
      aria-valuenow={props.width}
      aria-valuemin={props.min}
      tabIndex={0}
      title="ドラッグで幅を変更（ダブルクリックで元の幅）"
      className="
        absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize touch-none
        after:absolute after:inset-y-0 after:left-[3px] after:w-0.5 after:content-['']
        hover:after:bg-primary/60 focus-visible:after:bg-primary focus-visible:outline-none
      "
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault();
        // キャンバスの iframe の上に出ても操作が途切れないよう、ポインターを捕まえる。
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
          startX: event.clientX,
          startWidth: props.width,
        };
      }}
      onPointerMove={event => {
        const drag = dragRef.current;
        if (!drag) return;
        props.onResize(clamp(drag.startWidth + drag.startX - event.clientX));
      }}
      onPointerUp={() => (dragRef.current = null)}
      onPointerCancel={() => (dragRef.current = null)}
      onDoubleClick={() => props.onResize(clamp(props.defaultWidth))}
      onKeyDown={event => {
        const delta = (
          (event.key === "ArrowLeft")
          ? keyStep
          : (event.key === "ArrowRight" ? -keyStep : 0)
        );
        if (delta === 0) return;
        event.preventDefault();
        event.stopPropagation();
        props.onResize(clamp(props.width + delta));
      }}
    />
  );
}
