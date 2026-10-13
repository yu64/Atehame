import { pxToMm, resizedRect } from "@src/features/designer/canvas/geometry";
import type { PageSize } from "@src/features/designer/layoutCss";
import type { ElementRect } from "@src/features/designer/state/operations";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Moveable from "react-moveable";

// #############################################################################
// MARK: 型定義

export interface Props {
  /** 部品の名前（重なり順）。 */
  names: string[];
  /** 描画した部品の位置と大きさ（mm）。 */
  rects: Map<string, ElementRect>;
  paper: PageSize;
  selected: string | undefined;
  /** 1mm あたりの表示上の px（拡大率を含む）。 */
  unit: number;
  gridSnap: boolean;
  onSelect: (name: string | undefined) => void;
  /** ドラッグ中の変更（mm）。履歴には記録しない。 */
  onPreview: (name: string, rect: Partial<ElementRect>) => void;
  /** ドラッグの終了。直前までの変更を1回分として記録する。 */
  onCommit: () => void;
}

// #############################################################################
// MARK: コンポーネント

/**
 * 用紙の上に重ねる透明な操作レイヤー。部品の枠は、描画した結果を測った位置に置く。
 */
export function SelectionLayer(props: Props) {
  const { unit } = props;
  const boxRefs = useRef(new Map<string, HTMLDivElement>());
  const moveableRef = useRef<Moveable>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  // 選択された枠を操作対象にする。描画後に要素が決まるため effect で設定する。
  useEffect(() => {
    setTarget(props.selected ? (boxRefs.current.get(props.selected) ?? null) : null);
  }, [props.selected, props.names, props.rects]);

  // 描画結果の変化（数値入力や元に戻すなど）を操作枠に反映する。
  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [props.rects, unit]);

  const guidelines = useMemo(() => {
    const width = props.paper.width * unit;
    const height = props.paper.height * unit;
    return {
      vertical: [0, width / 2, width],
      horizontal: [0, height / 2, height],
    };
  }, [props.paper, unit]);

  const selected = props.selected;
  const otherBoxes = [...boxRefs.current.entries()]
    .filter(([name]) => name !== props.selected)
    .map(([, box]) => box);

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        width: props.paper.width * unit,
        height: props.paper.height * unit,
      }}
      onPointerDown={event => {
        if (event.target === event.currentTarget) props.onSelect(undefined);
      }}
    >
      {props.names.map(name => {
        const rect = props.rects.get(name);
        if (!rect) return null;
        const isSelected = name === props.selected;
        return (
          <div
            key={name}
            ref={box => {
              if (box) boxRefs.current.set(name, box);
              else boxRefs.current.delete(name);
            }}
            data-element-name={name}
            title={name}
            className={`
              absolute cursor-move
              ${isSelected ? "" : "outline outline-1 outline-dashed outline-sky-500/50 hover:outline-sky-500"}
            `}
            style={{
              left: rect.left * unit,
              top: rect.top * unit,
              width: Math.max(rect.width * unit, 4),
              height: Math.max(rect.height * unit, 4),
            }}
            onMouseDown={event => {
              if (isSelected || event.button !== 0) return;
              // 未選択の部品を押したら、選択して操作枠を作り、そのままドラッグを始める。
              // 操作枠（Moveable）はマウスのイベントで動くため mousedown で始める。
              // 描画を待たずにこの場で操作枠を作り、最初の移動から追従させる。
              const box = event.currentTarget;
              flushSync(() => props.onSelect(name));
              flushSync(() => setTarget(box));
              moveableRef.current?.dragStart(event.nativeEvent);
            }}
          />
        );
      })}

      {selected && target && (
        <Moveable
          ref={moveableRef}
          target={target}
          draggable
          resizable
          keepRatio={false}
          throttleDrag={0}
          throttleResize={0}
          origin={false}
          snappable
          snapThreshold={5}
          verticalGuidelines={guidelines.vertical}
          horizontalGuidelines={guidelines.horizontal}
          elementGuidelines={otherBoxes}
          onDrag={event => {
            const left = pxToMm(event.left, unit, props.gridSnap);
            const top = pxToMm(event.top, unit, props.gridSnap);
            event.target.style.left = `${left * unit}px`;
            event.target.style.top = `${top * unit}px`;
            props.onPreview(selected, {
              left,
              top,
            });
          }}
          onDragEnd={() => props.onCommit()}
          onResize={event => {
            const rect = resizedRect(
              {
                left: event.drag.left,
                top: event.drag.top,
                width: event.width,
                height: event.height,
              },
              unit,
              props.gridSnap,
            );
            const style = event.target.style;
            style.left = `${rect.left * unit}px`;
            style.top = `${rect.top * unit}px`;
            style.width = `${rect.width * unit}px`;
            style.height = `${rect.height * unit}px`;
            props.onPreview(selected, rect);
          }}
          onResizeEnd={() => props.onCommit()}
        />
      )}
    </div>
  );
}
