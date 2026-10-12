import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import { selectLayout } from "@src/features/designer/state/designerStore";

/** CSS 全体の読み書き。CSS タブで使う。 */
export function useDesignerCss() {
  const store = useDesignerStore();
  const css = useDesignerSelector(state => selectLayout(state).css);
  const warnings = useDesignerSelector(state => state.cssWarnings);
  const reveal = useDesignerSelector(state => state.cssReveal);
  return { css, warnings, reveal, setCss: store.setCss };
}
