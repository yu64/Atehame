import PaperFrame from "@src/features/designer/canvas/PaperFrame";
import SelectionLayer from "@src/features/designer/canvas/SelectionLayer";
import { canvasPadding } from "@src/features/designer/canvas/units";
import { useDesignerCanvas } from "@src/features/designer/hooks/useDesignerCanvas";
import { useDesignerView } from "@src/features/designer/hooks/useDesignerView";
import { pxPerMm } from "@src/shared/lib/units";
import { useEffect, useRef } from "react";

/**
 * 用紙を表示する領域。用紙（描画）と、その上の操作レイヤーを重ねる。
 * 用紙の外（灰色の部分）を押すと選択を外し、用紙の設定を表示できるようにする。
 */
export default function DesignerCanvas() {
  const canvas = useDesignerCanvas();
  const view = useDesignerView();
  const areaRef = useRef<HTMLDivElement>(null);
  const unit = pxPerMm * view.zoom;
  const { paper, select } = canvas;
  const { setZoom } = view;

  // 用紙が変わったときと、全体を表示する要求があったときに、用紙全体が見える拡大率にする。
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const width = area.clientWidth - canvasPadding * 2;
    const height = area.clientHeight - canvasPadding * 2;
    const fit = Math.min(width / (paper.width * pxPerMm), height / (paper.height * pxPerMm));
    setZoom(Math.max(0.1, Math.min(3, Math.floor(fit * 100) / 100)));
  }, [paper.width, paper.height, view.fitRequest, setZoom]);

  return (
    <div
      ref={areaRef}
      data-designer-canvas=""
      // キー操作を受けられるよう、押したらフォーカスを移す（デザイナーの根で受ける）。
      tabIndex={-1}
      className="flex-1 min-h-0 min-w-0 overflow-auto bg-base-hover outline-none"
      // 部品のドラッグが始まる前にフォーカスを移す（始まった後に移すとドラッグが途切れる）。
      onPointerDownCapture={event => event.currentTarget.focus({ preventScroll: true })}
      onPointerDown={event => {
        const area = event.currentTarget;
        const onScrollbar =
          event.nativeEvent.offsetX >= area.clientWidth ||
          event.nativeEvent.offsetY >= area.clientHeight;
        if (event.target === area && !onScrollbar) select(null);
      }}
    >
      <div
        className="relative"
        style={{ width: paper.width * unit, height: paper.height * unit, margin: canvasPadding }}
      >
        <PaperFrame
          layout={canvas.layout}
          sample={canvas.sample}
          paper={paper}
          scale={view.zoom}
          pxPerMm={pxPerMm}
          onCssWarnings={canvas.setCssWarnings}
          onMeasure={canvas.setRects}
        />
        <SelectionLayer
          names={canvas.names}
          rects={canvas.rects}
          paper={paper}
          selected={canvas.selected}
          unit={unit}
          gridSnap={view.gridSnap}
          onSelect={select}
          onPreview={canvas.preview}
          onCommit={canvas.commitPreview}
        />
      </div>
    </div>
  );
}
