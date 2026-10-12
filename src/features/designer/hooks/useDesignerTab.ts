import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import type { SidePanelTab } from "@src/features/designer/state/designerStore";

// #############################################################################
// MARK: フック

/** 右の欄のタブと、CSS タブに警告の印を付けるか。 */
export function useDesignerTab(): {
  tab: SidePanelTab;
  setTab: (tab: SidePanelTab) => void;
  cssWarning: boolean;
} {
  const store = useDesignerStore();
  const tab = useDesignerSelector(state => state.tab);
  const cssWarning = useDesignerSelector(state => state.cssWarnings.length > 0);
  return { tab, setTab: store.setTab, cssWarning };
}
