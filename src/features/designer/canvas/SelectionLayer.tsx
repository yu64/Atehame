import type { PageSize } from "@src/features/designer/layoutCss";
import type { ElementRect } from "@src/features/designer/state/operations";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Moveable from "react-moveable";

export interface Props {
  /** 部品の名前（重なり順）。 */
  names: string[];
  /** 描画した部品の位置と大きさ（mm）。 */
  rects: Map<string, ElementRect>;
  paper: PageSize;
  selected: string | null;
  /** 1mm あたりの表示上の px（拡大率を含む）。 */
  unit: number;
  gridSnap: boolean;
  onSelect: (name: string | null) => void;
  /** ドラッグ中の変更（mm）。履歴には記録しない。 */
  onPreview: (name: string, rect: Partial<ElementRect>) => void;
  /** ドラッグの終了。直前までの変更を1回分として記録する。 */
  onCommit: () => void;
}

/**
 * 用紙の上に重ねる透明な操作レイヤー。部品の枠は、描画した結果を測った位置に置く。
 */
export default function SelectionLayer(props: Props) {
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
    return { vertical: [0, width / 2, width], horizontal: [0, height / 2, height] };
  }, [props.paper, unit]);

  const otherBoxes = [...boxRefs.current.entries()]
    .filter(([name]) => name !== props.selected)
    .map(([, box]) => box);

  const toMm = (px: number) => px / unit;

  return (
    <div
      className="absolute left-0 top-0"
      style={{ width: props.paper.width * unit, height: props.paper.height * unit }}
      onPointerDown={event => {
        if (event.target === event.currentTarget) props.onSelect(null);
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

      {props.selected && target && (
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
          snapGridWidth={props.gridSnap ? unit : 0}
          snapGridHeight={props.gridSnap ? unit : 0}
          verticalGuidelines={guidelines.vertical}
          horizontalGuidelines={guidelines.horizontal}
          elementGuidelines={otherBoxes}
          onDrag={event => {
            event.target.style.left = `${event.left}px`;
            event.target.style.top = `${event.top}px`;
            props.onPreview(props.selected!, { left: toMm(event.left), top: toMm(event.top) });
          }}
          onDragEnd={() => props.onCommit()}
          onResize={event => {
            const style = event.target.style;
            style.width = `${event.width}px`;
            style.height = `${event.height}px`;
            style.left = `${event.drag.left}px`;
            style.top = `${event.drag.top}px`;
            props.onPreview(props.selected!, {
              left: toMm(event.drag.left),
              top: toMm(event.drag.top),
              width: Math.max(toMm(event.width), 1),
              height: Math.max(toMm(event.height), 1),
            });
          }}
          onResizeEnd={() => props.onCommit()}
        />
      )}
    </div>
  );
}
