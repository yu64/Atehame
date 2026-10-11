import type { ElementRule, LayoutDocument, PageSize } from "@src/features/designer/layoutCss";
import { paperSizeOf } from "@src/features/designer/model";
import { printPages } from "@src/features/designer/render";
import {
  useDesignerConfig,
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import type { DesignerState, SidePanelTab } from "@src/features/designer/state/designerStore";
import type { ElementRect } from "@src/features/designer/state/operations";
import type { ElementPreset } from "@src/features/designer/types";
import { useMemo } from "react";

/*
 * 用途ごとの状態と操作。各フックは必要な値だけを購読し、その用途の操作だけを返す。
 * たとえば部品の設定欄からは、選択中の部品の宣言しか書き換えられない。
 */

const selectLayout = (state: DesignerState): LayoutDocument => state.history.present;

/** 元に戻す・やり直す。 */
export function useDesignerHistory() {
  const store = useDesignerStore();
  const canUndo = useDesignerSelector(() => store.canUndo());
  const canRedo = useDesignerSelector(() => store.canRedo());
  return { canUndo, canRedo, undo: store.undo, redo: store.redo };
}

/** 拡大率と吸着。 */
export function useDesignerView() {
  const store = useDesignerStore();
  const zoom = useDesignerSelector(state => state.zoom);
  const gridSnap = useDesignerSelector(state => state.gridSnap);
  const fitRequest = useDesignerSelector(state => state.fitRequest);
  return {
    zoom,
    gridSnap,
    fitRequest,
    setZoom: store.setZoom,
    setGridSnap: store.setGridSnap,
    requestFit: store.requestFit,
  };
}

/** 部品の追加。状態は購読しない。 */
export function useAddElement(): (preset: ElementPreset, key?: string) => void {
  const store = useDesignerStore();
  const { fields } = useDesignerConfig();
  /** 雛形から追加する。key を指定すると、その値を埋め込む。 */
  return (preset, key) => store.add(preset, fields, key);
}

/** 部品の一覧と、削除・選択。 */
export function useDesignerElements() {
  const store = useDesignerStore();
  const elements = useDesignerSelector(state => selectLayout(state).elements);
  const selected = useDesignerSelector(state => state.selected);
  return { elements, selected, remove: store.remove, select: store.select };
}

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

/** 用紙の大きさ（mm）。 */
export function useDesignerPaper(): { size: PageSize; setSize: (size: PageSize) => void } {
  const store = useDesignerStore();
  const layout = useDesignerSelector(selectLayout);
  const size = useMemo(() => paperSizeOf(layout), [layout]);
  return { size, setSize: store.setPaperSize };
}

/** CSS 全体の読み書き。CSS タブで使う。 */
export function useDesignerCss() {
  const store = useDesignerStore();
  const css = useDesignerSelector(state => selectLayout(state).css);
  const warnings = useDesignerSelector(state => state.cssWarnings);
  const reveal = useDesignerSelector(state => state.cssReveal);
  return { css, warnings, reveal, setCss: store.setCss };
}

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

/** サンプルの値で印刷する。 */
export function useDesignerPrint(): () => Promise<void> {
  const store = useDesignerStore();
  const { sample } = useDesignerConfig();
  return () => printPages(store.layout, [sample]);
}
