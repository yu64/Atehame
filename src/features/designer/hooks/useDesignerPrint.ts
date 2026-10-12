import { printPages } from "@src/features/designer/render";
import { useDesignerConfig, useDesignerStore } from "@src/features/designer/state/DesignerContext";

// #############################################################################
// MARK: フック

/** サンプルの値で印刷する。 */
export function useDesignerPrint(): () => Promise<void> {
  const store = useDesignerStore();
  const { sample } = useDesignerConfig();
  return () => printPages(store.layout, [sample]);
}
