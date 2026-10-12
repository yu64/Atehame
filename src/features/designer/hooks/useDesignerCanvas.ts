import { paperSizeOf } from "@src/features/designer/model";
import {
  useDesignerConfig,
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import { selectLayout } from "@src/features/designer/state/designerStore";
import type { ElementRect } from "@src/features/designer/state/operations";
import { useMemo } from "react";

/** 用紙の表示と操作。キャンバスで使う。 */
export function useDesignerCanvas() {
  const store = useDesignerStore();
  const { sample } = useDesignerConfig();
  const layout = useDesignerSelector(selectLayout);
  const selected = useDesignerSelector(state => state.selected);
  const rects = useDesignerSelector(state => state.rects);
  const paper = useMemo(() => paperSizeOf(layout), [layout]);
  const names = useMemo(() => layout.elements.map(element => element.name), [layout]);

  return {
    layout,
    paper,
    names,
    sample,
    selected,
    rects,
    select: store.select,
    preview: (name: string, rect: Partial<ElementRect>) => store.preview(name, rect),
    commitPreview: store.commitPreview,
    setRects: store.setRects,
    setCssWarnings: store.setCssWarnings,
  };
}
