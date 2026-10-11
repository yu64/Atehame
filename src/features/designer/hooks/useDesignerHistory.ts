import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";

/** 元に戻す・やり直す。 */
export function useDesignerHistory() {
  const store = useDesignerStore();
  const canUndo = useDesignerSelector(() => store.canUndo());
  const canRedo = useDesignerSelector(() => store.canRedo());
  return { canUndo, canRedo, undo: store.undo, redo: store.redo };
}

export default useDesignerHistory;
