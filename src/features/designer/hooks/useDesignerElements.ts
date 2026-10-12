import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import { selectLayout } from "@src/features/designer/state/designerStore";

// #############################################################################
// MARK: フック

/** 部品の一覧と、削除・選択。 */
export function useDesignerElements() {
  const store = useDesignerStore();
  const elements = useDesignerSelector(state => selectLayout(state).elements);
  const selected = useDesignerSelector(state => state.selected);
  return {
    elements,
    selected,
    remove: store.remove,
    select: store.select,
  };
}
