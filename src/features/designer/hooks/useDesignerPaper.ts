import type { PageSize } from "@src/features/designer/layoutCss";
import { paperSizeOf } from "@src/features/designer/model";
import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import { selectLayout } from "@src/features/designer/state/designerStore";
import { useMemo } from "react";

// #############################################################################
// MARK: フック

/** 用紙の大きさ（mm）。 */
export function useDesignerPaper(): { size: PageSize; setSize: (size: PageSize) => void } {
  const store = useDesignerStore();
  const layout = useDesignerSelector(selectLayout);
  const size = useMemo(() => paperSizeOf(layout), [layout]);
  return { size, setSize: store.setPaperSize };
}
