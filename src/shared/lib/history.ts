// #############################################################################
// MARK: 履歴

/** 元に戻す・やり直すの履歴。値は丸ごと保存する（差分は持たないため、小さな値に向く）。 */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** ドラッグ中など、確定前の変更を始めた時点の値。確定時に1回分として記録する。 */
  previewBase?: T;
  /** 直前の変更をまとめるためのキーと時刻。 */
  lastMergeKey?: string;
  lastTime?: number;
}

export type HistoryAction<T> =
  /** 変更を確定する。同じ mergeKey の変更が続く間は1回分にまとめる。 */
  | { type: "set"; next: T; mergeKey?: string; now: number }
  /** 直前の値から次の値を作って確定する。キーの連打など、描画前に続く変更で使う。 */
  | { type: "update"; apply: (present: T) => T; mergeKey?: string; now: number }
  /** 確定前の変更（ドラッグ中など）。履歴には記録しない。 */
  | { type: "preview"; next: T }
  /** 確定前の変更を1回分として記録する。 */
  | { type: "commitPreview" }
  | { type: "undo" }
  | { type: "redo" }
  /** 外部から値が差し替えられた場合など、履歴を捨てて始め直す。 */
  | { type: "reset"; present: T };

export const historyLimit = 100;
export const mergeWindowMs = 1000;

// #############################################################################
// MARK: 操作

/** present だけを持つ、空の履歴。 */
export function createHistory<T>(present: T): History<T> {
  return {
    past: [],
    present,
    future: [],
  };
}

/** 履歴に操作を適用した、新しい履歴を返す。 */
export function historyReducer<T>(history: History<T>, action: HistoryAction<T>): History<T> {
  switch (action.type) {
    case "set": {
      if (action.next === history.present) return history;
      const settled = settle(history);
      const merge = (
        action.mergeKey !== undefined
        && action.mergeKey === settled.lastMergeKey
        && settled.lastTime !== undefined
        && action.now - settled.lastTime < mergeWindowMs
      );

      return {
        past: (merge ? settled.past : pushLimited(settled.past, settled.present)),
        present: action.next,
        future: [],
        lastMergeKey: action.mergeKey,
        lastTime: action.now,
      };
    }

    case "update":
      return historyReducer(history, {
        type: "set",
        next: action.apply(history.present),
        mergeKey: action.mergeKey,
        now: action.now,
      });

    case "preview":
      return {
        ...history,
        previewBase: history.previewBase ?? history.present,
        present: action.next,
      };

    case "commitPreview":
      return settle(history);

    case "undo": {
      const settled = settle(history);
      const previous = settled.past.at(-1);
      if (previous === undefined) return settled;
      return {
        past: settled.past.slice(0, -1),
        present: previous,
        future: [settled.present, ...settled.future],
      };
    }

    case "redo": {
      const settled = settle(history);
      const [next, ...future] = settled.future;
      if (next === undefined) return settled;
      return {
        past: pushLimited(settled.past, settled.present),
        present: next,
        future,
      };
    }

    case "reset":
      return createHistory(action.present);
  }
}

/** 確定前の変更があれば1回分として記録する。 */
function settle<T>(history: History<T>): History<T> {
  if (history.previewBase === undefined) return history;
  const { previewBase, ...rest } = history;
  if (previewBase === history.present) return rest;
  return {
    past: pushLimited(history.past, previewBase),
    present: history.present,
    future: [],
  };
}

/** 末尾に追加する。上限を超えたら古いものから捨てる。 */
function pushLimited<T>(items: T[], item: T): T[] {
  const next = [...items, item];
  return (next.length > historyLimit ? next.slice(next.length - historyLimit) : next);
}

// #############################################################################
// MARK: 状態

/** 元に戻せるか（確定前の変更があれば、それも戻せる）。 */
export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0 || history.previewBase !== undefined;
}

/** やり直せるか。 */
export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}
