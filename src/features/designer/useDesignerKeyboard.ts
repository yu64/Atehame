import type { DesignerStore } from "@src/features/designer/state/designerStore";
import { pxPerMm } from "@src/shared/lib/units";
import { useCallback, type KeyboardEvent } from "react";

/** 矢印キーで 1px、Shift と矢印キーで 1mm 動かす。 */
const pxInMm = 1 / pxPerMm;

/**
 * デザイナーのキー操作。デザイナーの根の要素の onKeyDown に渡すため、
 * デザイナーの外のキー入力には反応しない。入力欄や CSS エディターの中では、それぞれの標準の操作を優先する。
 */
export default function useDesignerKeyboard(store: DesignerStore) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || isEditable(event.target)) return;

      const selected = store.getState().selected;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (mod && key === "z" && !event.shiftKey) store.undo();
      else if (mod && (key === "y" || (key === "z" && event.shiftKey))) store.redo();
      else if (mod && key === "d") {
        if (selected !== null) store.duplicate(selected);
      } else if (key === "delete" || key === "backspace") {
        if (selected !== null) store.remove(selected);
      } else if (key === "escape") store.select(null);
      else if (key.startsWith("arrow")) {
        if (selected === null) return;
        const step = event.shiftKey ? 1 : pxInMm;
        const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
        const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
        store.nudge(selected, dx, dy);
      } else return;

      event.preventDefault();
    },
    [store],
  );
}

function isEditable(target: EventTarget): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest(".monaco-editor")) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}
