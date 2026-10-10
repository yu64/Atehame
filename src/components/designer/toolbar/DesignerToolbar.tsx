import {
  useDesignerHistory,
  useDesignerPrint,
  useDesignerView,
} from "@src/components/designer/state/hooks";
import { useState } from "react";

export const zoomSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

/** デザイナーの操作バー。元に戻す、拡大率、吸着、サンプルの印刷。 */
export default function DesignerToolbar() {
  const history = useDesignerHistory();
  const view = useDesignerView();
  const print = useDesignerPrint();
  const [printError, setPrintError] = useState<string | null>(null);

  const zoomIn = zoomSteps.find(step => step > view.zoom + 0.001) ?? view.zoom;
  const zoomOut = [...zoomSteps].reverse().find(step => step < view.zoom - 0.001) ?? view.zoom;

  async function printSample() {
    setPrintError(null);
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
        <ToolButton
          icon="i-lucide-undo-2"
          label="元に戻す (Ctrl+Z)"
          disabled={!history.canUndo}
          onClick={history.undo}
        />
        <ToolButton
          icon="i-lucide-redo-2"
          label="やり直す (Ctrl+Y)"
          disabled={!history.canRedo}
          onClick={history.redo}
        />
        <span className="mx-2 h-5 border-l border-surface-border" aria-hidden="true" />
        <ToolButton icon="i-lucide-zoom-out" label="縮小" onClick={() => view.setZoom(zoomOut)} />
        <span className="w-12 text-center text-sm tabular-nums">
          {Math.round(view.zoom * 100)}%
        </span>
        <ToolButton icon="i-lucide-zoom-in" label="拡大" onClick={() => view.setZoom(zoomIn)} />
        <ToolButton icon="i-lucide-scan" label="用紙全体を表示" onClick={view.requestFit} />
        <span className="mx-2 h-5 border-l border-surface-border" aria-hidden="true" />
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={view.gridSnap}
            onChange={event => view.setGridSnap(event.currentTarget.checked)}
          />
          1mm に吸着
        </label>
        <button
          type="button"
          className="atehame-btn-secondary btn-sm ml-auto"
          onClick={printSample}
        >
          <span className="i-lucide-printer size-4" aria-hidden="true" />
          サンプルを印刷
        </button>
      </div>
      {printError && (
        <p role="alert" className="shrink-0 px-3 py-1 text-sm bg-status-error-bg text-status-error">
          印刷できませんでした: {printError}
        </p>
      )}
    </>
  );
}

function ToolButton(props: {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="atehame-btn-secondary btn-sm btn-square p-0"
      aria-label={props.label}
      title={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <span className={`${props.icon} size-4`} aria-hidden="true" />
    </button>
  );
}
