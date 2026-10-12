import { useDesignerHistory } from "@src/features/designer/hooks/useDesignerHistory";
import { useDesignerPrint } from "@src/features/designer/hooks/useDesignerPrint";
import { useDesignerView } from "@src/features/designer/hooks/useDesignerView";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { Checkbox } from "@src/shared/ui/Checkbox";
import { useState } from "react";

export const zoomSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

/** デザイナーの操作バー。元に戻す、拡大率、吸着、サンプルの印刷。 */
export function DesignerToolbar() {
  const history = useDesignerHistory();
  const view = useDesignerView();
  const print = useDesignerPrint();
  const [printError, setPrintError] = useState<string>();

  const zoomIn = zoomSteps.find(step => step > view.zoom + 0.001) ?? view.zoom;
  const zoomOut = [...zoomSteps].reverse().find(step => step < view.zoom - 0.001) ?? view.zoom;

  async function printSample() {
    setPrintError(undefined);
    try {
      await print();
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="デザイナーの操作"
        className="flex flex-wrap items-center gap-1 shrink-0 px-3 py-1.5 border-b border-surface-border bg-surface"
      >
        <Button
          iconOnly
          icon="i-lucide-undo-2"
          label="元に戻す (Ctrl+Z)"
          disabled={!history.canUndo}
          onClick={history.undo}
        />
        <Button
          iconOnly
          icon="i-lucide-redo-2"
          label="やり直す (Ctrl+Y)"
          disabled={!history.canRedo}
          onClick={history.redo}
        />
        <span className="mx-2 h-5 border-l border-surface-border" aria-hidden="true" />
        <Button
          iconOnly
          icon="i-lucide-zoom-out"
          label="縮小"
          onClick={() => view.setZoom(zoomOut)}
        />
        <span className="w-12 text-center text-sm tabular-nums">
          {Math.round(view.zoom * 100)}%
        </span>
        <Button
          iconOnly
          icon="i-lucide-zoom-in"
          label="拡大"
          onClick={() => view.setZoom(zoomIn)}
        />
        <Button iconOnly icon="i-lucide-scan" label="用紙全体を表示" onClick={view.requestFit} />
        <span className="mx-2 h-5 border-l border-surface-border" aria-hidden="true" />
        <Checkbox
          label="1mm 刻みで動かす"
          title="ドラッグで動かすときや大きさを変えるときに、位置と大きさを 1mm 刻みにそろえます。用紙の端・中央やほかの部品の端への吸着は、この設定に関係なく働きます。"
          checked={view.gridSnap}
          onChange={view.setGridSnap}
        />
        <Button
          icon="i-lucide-printer"
          label="サンプルを印刷"
          className="ml-auto"
          onClick={printSample}
        />
      </div>
      {printError && (
        <Alert
          kind="error"
          bar
          messages={[`印刷できませんでした: ${printError}`]}
          className="shrink-0"
        />
      )}
    </>
  );
}
