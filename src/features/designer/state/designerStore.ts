import type { LayoutDocument, PageSize } from "@src/features/designer/layoutCss";
import { paperSizeOf } from "@src/features/designer/model";
import {
  addFromPreset,
  duplicateElement,
  moveElementBy,
  placeElement,
  setPaperSize,
  type ElementRect,
} from "@src/features/designer/state/operations";
import type { ElementPreset, RevealRequest } from "@src/features/designer/types";
import {
  canRedo,
  canUndo,
  createHistory,
  historyReducer,
  type History,
  type HistoryAction,
} from "@src/shared/lib/history";
import { Store } from "@src/shared/lib/store";

export type SidePanelTab = "properties" | "list" | "css";

export interface DesignerState {
  history: History<LayoutDocument>;
  /** 選択中の部品の名前。null なら用紙を選択している。 */
  selected: string | null;
  /**
   * 選択し直すたびに変わる番号。名前を変えても変わらないため、設定欄の作り直しの目印に使う
   * （名前で作り直すと、名前を1文字打つたびに入力欄のフォーカスが外れる）。
   */
  selectionKey: number;
  /** 右の欄で開いているタブ。部品の追加や「CSS で編集」からも切り替える。 */
  tab: SidePanelTab;
  /** CSS タブで表示する行。 */
  cssReveal?: RevealRequest;
  zoom: number;
  /** 用紙全体を表示する要求。値が変わるたびにキャンバスが拡大率を合わせる。 */
  fitRequest: number;
  gridSnap: boolean;
  /** 描画した部品の位置と大きさ（mm）。 */
  rects: Map<string, ElementRect>;
  /** CSS を安全化したときに取り除いた記述の警告。 */
  cssWarnings: string[];
}

/** 状態から、今の文書を選ぶ。 */
export const selectLayout = (state: DesignerState): LayoutDocument => state.history.present;

/**
 * デザイナーの状態と操作。React に依存せず、useStoreSelector で購読する。
 * 確定した変更（ドラッグ中の途中経過を除く）だけを onCommit で外へ知らせる。
 */
export class DesignerStore extends Store<DesignerState> {
  /** 外へ知らせた文書。これと異なる文書が外から来たら差し替えとみなす。 */
  #committed: LayoutDocument;
  onCommit: (layout: LayoutDocument) => void;

  constructor(initial: LayoutDocument, onCommit: (layout: LayoutDocument) => void) {
    super({
      history: createHistory(initial),
      selected: null,
      selectionKey: 0,
      tab: "properties",
      zoom: 1,
      fitRequest: 0,
      gridSnap: false,
      rects: new Map(),
      cssWarnings: [],
    });
    this.#committed = initial;
    this.onCommit = onCommit;
  }

  #set(update: (state: DesignerState) => DesignerState) {
    const previous = this.getState();
    let next = update(previous);
    if (next === previous) return;

    // 元に戻すや CSS の編集で選択中の部品がなくなったら、選択を外す。
    const layout = next.history.present;
    if (next.selected !== null && !layout.element(next.selected))
      next = { ...next, selected: null };

    this.replaceState(next);

    if (next.history.previewBase === undefined && layout !== this.#committed) {
      this.#committed = layout;
      this.onCommit(layout);
    }
  }

  /** 履歴を進める。patch は同時に変える状態（選択など）。 */
  #history(action: HistoryAction<LayoutDocument>, patch?: Partial<DesignerState>) {
    this.#set(state => {
      const history = historyReducer(state.history, action);
      if (history === state.history && !patch) return state;
      return { ...state, ...patch, history };
    });
  }

  /** 文書を書き換えて確定する。同じ mergeKey の変更が続く間は、元に戻すの1回分にまとめる。 */
  #edit(
    apply: (layout: LayoutDocument) => LayoutDocument,
    mergeKey?: string,
    patch?: Partial<DesignerState>,
  ) {
    this.#history({ type: "update", apply, mergeKey, now: Date.now() }, patch);
  }

  get layout(): LayoutDocument {
    return this.getState().history.present;
  }

  /** 外から渡された文書を受け取る。知らせた文書と同じ CSS なら何もしない。 */
  receive(layout: LayoutDocument) {
    if (layout.css === this.#committed.css) return;
    this.#committed = layout;
    this.#history({ type: "reset", present: layout });
  }

  // 履歴

  canUndo = () => canUndo(this.getState().history);
  canRedo = () => canRedo(this.getState().history);
  undo = () => this.#history({ type: "undo" });
  redo = () => this.#history({ type: "redo" });

  // 表示

  setZoom = (zoom: number) => this.#set(state => ({ ...state, zoom }));
  requestFit = () => this.#set(state => ({ ...state, fitRequest: state.fitRequest + 1 }));
  setGridSnap = (gridSnap: boolean) => this.#set(state => ({ ...state, gridSnap }));
  setTab = (tab: SidePanelTab) => this.#set(state => ({ ...state, tab }));
  setRects = (rects: Map<string, ElementRect>) => this.#set(state => ({ ...state, rects }));
  setCssWarnings = (cssWarnings: string[]) => this.#set(state => ({ ...state, cssWarnings }));

  // 部品

  select = (name: string | null) =>
    this.#set(state => (state.selected === name ? state : { ...state, ...this.#selection(name) }));

  /** 選択を変えるときの状態。 */
  #selection(name: string | null): Pick<DesignerState, "selected" | "selectionKey"> {
    return { selected: name, selectionKey: this.getState().selectionKey + 1 };
  }

  /** 雛形から部品を追加して選択し、設定タブを開く。 */
  add = (preset: ElementPreset, fields: string[], key?: string) => {
    const result = addFromPreset(this.layout, preset, {
      key,
      fields,
      paper: this.paperSize(),
    });
    this.#edit(() => result.layout, undefined, {
      ...this.#selection(result.name),
      tab: "properties",
    });
  };

  remove = (name: string) => this.#edit(layout => layout.removeElement(name));

  setDeclaration = (name: string, property: string, value: string | undefined) =>
    this.#edit(
      layout => layout.setDeclaration({ element: name }, property, value),
      `${name}:${property}`,
    );

  rename = (from: string, to: string) =>
    this.#edit(
      layout => layout.renameElement(from, to),
      // 名前は1文字打つたびに変わるため、名前ではなく「名前の変更」でまとめる。
      "rename",
      this.getState().selected === from ? { selected: to } : undefined,
    );

  duplicate = (name: string) => {
    const result = duplicateElement(this.layout, name, this.getState().rects.get(name));
    if (!result.name) return;
    this.#edit(() => result.layout, undefined, this.#selection(result.name));
  };

  reorder = (name: string, to: "front" | "back") =>
    this.#edit(layout => layout.moveElement(name, to));

  /** 位置をずらす（mm）。キーの連打で続く変更も取りこぼさないよう、直前の文書から作る。 */
  nudge = (name: string, dx: number, dy: number) =>
    this.#edit(
      layout => moveElementBy(layout, name, dx, dy, this.getState().rects.get(name)),
      `nudge:${name}`,
    );

  /** CSS タブを開き、部品の規則の行を表示する。 */
  showCss = (name: string) => {
    const rule = this.layout.element(name);
    const line = rule ? this.layout.css.slice(0, rule.range.start).split("\n").length : undefined;
    this.#set(state => ({
      ...state,
      tab: "css",
      cssReveal: line !== undefined ? { line, key: Date.now() } : state.cssReveal,
    }));
  };

  // ドラッグ

  /** ドラッグ中の変更。commitPreview までは履歴に記録せず、外へも知らせない。 */
  preview = (name: string, rect: Partial<ElementRect>) =>
    this.#history({ type: "preview", next: placeElement(this.layout, name, rect) });

  commitPreview = () => this.#history({ type: "commitPreview" });

  // 用紙と CSS

  paperSize = (): PageSize => paperSizeOf(this.layout);

  setPaperSize = (size: PageSize) => this.#edit(layout => setPaperSize(layout, size), "paper");

  setCss = (css: string) => this.#edit(layout => layout.withCss(css), "css");
}
