import type { ElementRule } from "@src/features/designer/layoutCss";
import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import { selectLayout } from "@src/features/designer/state/designerStore";
import { useMemo } from "react";

export interface SelectedElement {
  rule: ElementRule;
  /** 選択し直すたびに変わる番号（名前を変えても変わらない）。 */
  selectionKey: number;
  /** ほかの部品の名前（重複の確認用）。 */
  otherNames: string[];
  setDeclaration: (property: string, value: string | undefined) => void;
  rename: (name: string) => void;
  remove: () => void;
  duplicate: () => void;
  reorder: (to: "front" | "back") => void;
  showCss: () => void;
}

/** 選択中の部品と、その部品だけへの操作。選択していなければ undefined。 */
export function useSelectedElement(): SelectedElement | undefined {
  const store = useDesignerStore();
  const elements = useDesignerSelector(state => selectLayout(state).elements);
  const selected = useDesignerSelector(state => state.selected);
  const selectionKey = useDesignerSelector(state => state.selectionKey);

  return useMemo(() => {
    const rule = elements.find(element => element.name === selected);
    if (!rule) return undefined;
    const name = rule.name;
    return {
      rule,
      selectionKey,
      otherNames: elements.filter(element => element !== rule).map(element => element.name),
      setDeclaration: (property, value) => store.setDeclaration(name, property, value),
      rename: to => store.rename(name, to),
      remove: () => store.remove(name),
      duplicate: () => store.duplicate(name),
      reorder: to => store.reorder(name, to),
      showCss: () => store.showCss(name),
    };
  }, [store, elements, selected, selectionKey]);
}

export default useSelectedElement;
