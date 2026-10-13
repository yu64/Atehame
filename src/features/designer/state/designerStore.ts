import type { LayoutAsset } from "@src/features/designer/assets/assets";
import type { LayoutDocument, PageSize } from "@src/features/designer/layoutCss";
import { paperSizeOf } from "@src/features/designer/model";
import { ElementIds } from "@src/features/designer/state/elementIds";
import {
  addFromPreset,
  duplicateElement,
  type ElementRect,
  moveElementBy,
  placeElement,
  setPaperSize,
} from "@src/features/designer/state/operations";
import type { ElementPreset, RevealRequest } from "@src/features/designer/types";
import {
  canRedo,
  canUndo,
  createHistory,
  type History,
  type HistoryAction,
  historyReducer,
} from "@src/shared/lib/history";
import { Store } from "@src/shared/lib/store";

export type SidePanelTab = "properties" | "list" | "assets" | "css";

export interface DesignerState {
  history: History<LayoutDocument>;
  /**
   * 選択中の部品の ID。null なら用紙を選択している。
   * 名前を変えても、元に戻しても同じ部品を指す（state/elementIds.ts）。
   */
  selectedId: string | undefined;
  /** 選択中の部品の今の名前。selectedId から引いたもの。 */
  selected: string | undefined;
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
}

/** 状態から、今の文書を選ぶ。 */
export function selectLayout(state: DesignerState): LayoutDocument {
  return state.history.present;
}

/**
 * デザイナーの状態と操作。React に依存せず、useStoreSelector で購読する。
 * 確定した変更（ドラッグ中の途中経過を除く）だけを onCommit で外へ知らせる。
 */
export class DesignerStore extends Store<DesignerState> {
  /** 外へ知らせた文書。これと異なる文書が外から来たら差し替えとみなす。 */
  #committed: LayoutDocument;
  #ids = new ElementIds();
  /** 実行中の名前の変更。新しい版の ID の対応表を作るときに使う。 */
  #renaming: { from: string; to: string } | undefined;
  onCommit: (layout: LayoutDocument) => void;

  constructor(initial: LayoutDocument, onCommit: (layout: LayoutDocument) => void) {
    super({
      history: createHistory(initial),
      selectedId: undefined,
      selected: undefined,
      tab: "properties",
      zoom: 1,
      fitRequest: 0,
      gridSnap: false,
      rects: new Map(),
    });
    this.#committed = initial;
    this.onCommit = onCommit;
    this.#ids.register(initial);
  }

  // ===========================================================================
  // MARK: 状態の更新

  /** 状態を更新する。版が変わったら、部品の ID と選択を今の版に合わせる。 */
  #set(update: (state: DesignerState) => DesignerState) {
    const previous = this.getState();
    let next = update(previous);
    if (next === previous) return;

    // 新しい版なら ID の対応表を前の版から作り、選択している ID を今の名前に引き直す。
    // 元に戻すや CSS の編集で選択中の部品がなくなったら、選択を外す。
    const layout = next.history.present;
    this.#ids.register(layout, previous.history.present, this.#renaming);
    const selected = (
      (next.selectedId === undefined)
      ? undefined
      : this.#ids.nameOf(layout, next.selectedId)
    );
    if (selected === undefined && next.selectedId !== undefined) {
      next = {
        ...next,
        selectedId: undefined,
      };
    }
    if (selected !== next.selected) {
      next = {
        ...next,
        selected,
      };
    }

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
      return {
        ...state,
        ...patch,
        history,
      };
    });
  }

  /** 文書を書き換えて確定する。同じ mergeKey の変更が続く間は、元に戻すの1回分にまとめる。 */
  #edit(
    apply: (layout: LayoutDocument) => LayoutDocument,
    mergeKey?: string,
    patch?: Partial<DesignerState>,
  ) {
    this.#history(
      {
        type: "update",
        apply,
        mergeKey,
        now: Date.now(),
      },
      patch,
    );
  }

  /** 今のレイアウト（確定前の変更も含む）。 */
  get layout(): LayoutDocument {
    return this.getState().history.present;
  }

  /** 外から渡された文書を受け取る。知らせた文書と同じ内容（CSS と画像）なら何もしない。 */
  receive(layout: LayoutDocument) {
    if (layout.css === this.#committed.css && layout.assets === this.#committed.assets) return;
    this.#committed = layout;
    this.#history({
      type: "reset",
      present: layout,
    });
  }

  // ===========================================================================
  // MARK: 履歴

  /** 元に戻せるか。 */
  canUndo = () => canUndo(this.getState().history);
  /** やり直せるか。 */
  canRedo = () => canRedo(this.getState().history);
  /** 元に戻す。 */
  undo = () => this.#history({ type: "undo" });
  /** やり直す。 */
  redo = () => this.#history({ type: "redo" });

  // ===========================================================================
  // MARK: 表示

  /** 表示の拡大率を変える。 */
  setZoom = (zoom: number) =>
    this.#set(state => ({
      ...state,
      zoom,
    }));
  /** 用紙を画面に合わせる大きさで表示し直すよう頼む。 */
  requestFit = () =>
    this.#set(state => ({
      ...state,
      fitRequest: state.fitRequest + 1,
    }));
  /** 1mm 刻みで動かすかを切り替える。 */
  setGridSnap = (gridSnap: boolean) =>
    this.#set(state => ({
      ...state,
      gridSnap,
    }));
  /** 右の欄のタブを切り替える。 */
  setTab = (tab: SidePanelTab) =>
    this.#set(state => ({
      ...state,
      tab,
    }));
  /** プレビューで測った、部品の位置と大きさを記録する。 */
  setRects = (rects: Map<string, ElementRect>) =>
    this.#set(state => ({
      ...state,
      rects,
    }));

  // ===========================================================================
  // MARK: 部品

  /** 部品を選ぶ。undefined なら選択を外す。 */
  select = (name: string | undefined) => {
    const id = (name === undefined ? undefined : this.#ids.idOf(this.layout, name));
    this.#set(state => (
      (state.selectedId === id)
      ? state
      : {
        ...state,
        selectedId: id,
      }
    ),
    );
  };

  /**
   * 雛形から部品を追加して選択し、設定タブを開く。
   * 画像が必要な雛形で、画像がまだ登録されていなければ、追加せずに画像タブを開く。
   */
  add = (preset: ElementPreset, fields: string[], key?: string) => {
    const assets = Object.keys(this.layout.assets);
    if (preset.requiresAsset && assets.length === 0) {
      this.setTab("assets");
      return;
    }
    const result = addFromPreset(this.layout, preset, {
      key,
      fields,
      assets,
      paper: this.paperSize(),
    });
    this.#edit(() => result.layout, undefined, { tab: "properties" });
    this.select(result.name);
  };

  /** 部品を消す。 */
  remove = (name: string) => this.#edit(layout => layout.removeElement(name));

  /** 部品の宣言を設定する。value が undefined なら宣言を取り除く。 */
  setDeclaration = (name: string, property: string, value: string | undefined) =>
    this.#edit(
      layout => layout.setDeclaration({ element: name }, property, value),
      `${name}:${property}`,
    );

  /** 名前を変える。ID は引き継ぐので、選択はそのまま保たれる。 */
  rename = (from: string, to: string) => {
    this.#renaming = {
      from,
      to,
    };
    try {
      // 名前は1文字打つたびに変わるため、名前ではなく「名前の変更」でまとめる。
      this.#edit(layout => layout.renameElement(from, to), "rename");
    } finally {
      this.#renaming = undefined;
    }
  };

  /** 部品を複製し、複製したほうを選ぶ。 */
  duplicate = (name: string) => {
    const result = duplicateElement(this.layout, name, this.getState().rects.get(name));
    if (!result.name) return;
    this.#edit(() => result.layout);
    this.select(result.name);
  };

  /** 部品を最前面または最背面へ移す。 */
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
    const line = (rule ? this.layout.css.slice(0, rule.range.start).split("\n").length : undefined);
    this.#set(state => ({
      ...state,
      tab: "css",
      cssReveal: (
        (line !== undefined)
        ? {
          line,
          key: Date.now(),
        }
        : state.cssReveal
      ),
    }));
  };

  // ===========================================================================
  // MARK: 画像

  /** 画像を登録する。同じ名前があれば差し替える。 */
  setAsset = (name: string, asset: LayoutAsset) =>
    this.#edit(layout => layout.setAsset(name, asset));

  /** 画像の名前を変え、参照している部品も書き換える。 */
  renameAsset = (from: string, to: string) =>
    // 名前は1文字打つたびに変わるため、名前ではなく「画像の名前の変更」でまとめる。
    this.#edit(layout => layout.renameAsset(from, to), "asset-rename");

  /** 画像を取り除く。参照している部品は「画像がありません」になる。 */
  removeAsset = (name: string) => this.#edit(layout => layout.removeAsset(name));

  // ===========================================================================
  // MARK: ドラッグ

  /** ドラッグ中の変更。commitPreview までは履歴に記録せず、外へも知らせない。 */
  preview = (name: string, rect: Partial<ElementRect>) =>
    this.#history({
      type: "preview",
      next: placeElement(this.layout, name, rect),
    });

  /** ドラッグ中の変更を確定し、1回分として履歴に記録する。 */
  commitPreview = () => this.#history({ type: "commitPreview" });

  // ===========================================================================
  // MARK: 用紙と CSS

  /** 用紙の大きさ（mm）。 */
  paperSize = (): PageSize => paperSizeOf(this.layout);

  /** 用紙の大きさ（mm）を変える。続けて変えた場合は1回分として履歴に残す。 */
  setPaperSize = (size: PageSize) => this.#edit(layout => setPaperSize(layout, size), "paper");

  /** CSS を丸ごと置き換える。続けて打った場合は1回分として履歴に残す。 */
  setCss = (css: string) => this.#edit(layout => layout.withCss(css), "css");
}
