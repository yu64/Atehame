import { keyCommand } from "@src/features/designer/hooks/keyCommand";
import type { DesignerStore } from "@src/features/designer/state/designerStore";
import { isEditableTarget } from "@src/shared/lib/dom";
import { type KeyboardEvent, useCallback } from "react";

// #############################################################################
// MARK: フック

/**
 * デザイナーのキー操作。デザイナーの根の要素の onKeyDown に渡すため、
 * デザイナーの外のキー入力には反応しない。入力欄や CSS エディターの中では、それぞれの標準の操作を優先する。
 */
export function useDesignerKeyboard(store: DesignerStore) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented || isEditable(event.target)) return;

      const command = keyCommand(event);
      if (!command) return;
      const selected = store.getState().selected;

      switch (command.type) {
        case "undo":
          store.undo();
          break;
        case "redo":
          store.redo();
          break;
        case "duplicate":
          if (selected !== undefined) store.duplicate(selected);
          break;
        case "remove":
          if (selected !== undefined) store.remove(selected);
          break;
        case "deselect":
          store.select(undefined);
          break;
        case "nudge":
          // 選択がなければ、矢印キーは標準の動き（スクロール）のままにする。
          if (selected === undefined) return;
          store.nudge(selected, command.dx, command.dy);
          break;
      }

      event.preventDefault();
    },
    [store],
  );
}

// #############################################################################
// MARK: 内部関数

/** 文字を入力する場所か（そこではキー操作を横取りしない）。 */
function isEditable(target: EventTarget): boolean {
  // CSS エディターの中と、ダイアログ（削除の確認など）の中では、それぞれの操作を優先する。
  if (target instanceof HTMLElement && target.closest(".monaco-editor, dialog")) return true;
  return isEditableTarget(target);
}
