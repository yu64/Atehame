import {
  canRedo,
  canUndo,
  createHistory,
  historyLimit,
  historyReducer,
  mergeWindowMs,
  type History,
  type HistoryAction,
} from "@src/features/designer/state/history";
import { describe, expect, test } from "vitest";

function apply<T>(history: History<T>, ...actions: HistoryAction<T>[]): History<T> {
  return actions.reduce(historyReducer<T>, history);
}

describe("元に戻す・やり直す", () => {
  test("変更を戻して、やり直せる", () => {
    let history = apply(
      createHistory(0),
      { type: "set", next: 1, now: 0 },
      { type: "set", next: 2, now: 0 },
    );
    history = apply(history, { type: "undo" });
    expect(history.present).toBe(1);
    expect(canRedo(history)).toBe(true);
    history = apply(history, { type: "redo" });
    expect(history.present).toBe(2);
  });

  test("新しい変更でやり直しの履歴は消える", () => {
    const history = apply(
      createHistory(0),
      { type: "set", next: 1, now: 0 },
      { type: "undo" },
      { type: "set", next: 5, now: 0 },
    );
    expect(history.present).toBe(5);
    expect(canRedo(history)).toBe(false);
  });

  test("同じキーの連続した変更は1回分にまとめる", () => {
    const history = apply(
      createHistory(0),
      { type: "set", next: 1, mergeKey: "x", now: 0 },
      { type: "set", next: 2, mergeKey: "x", now: 100 },
      { type: "set", next: 3, mergeKey: "x", now: 200 },
    );
    expect(history.past).toEqual([0]);
    expect(apply(history, { type: "undo" }).present).toBe(0);
  });

  test("時間が空くか、キーが変わればまとめない", () => {
    const history = apply(
      createHistory(0),
      { type: "set", next: 1, mergeKey: "x", now: 0 },
      { type: "set", next: 2, mergeKey: "x", now: mergeWindowMs + 1 },
      { type: "set", next: 3, mergeKey: "y", now: mergeWindowMs + 2 },
    );
    expect(history.past).toEqual([0, 1, 2]);
  });

  test("直前の値から計算する変更は、連続しても取りこぼさない", () => {
    const increment = (value: number) => value + 1;
    const history = apply(
      createHistory(0),
      { type: "update", apply: increment, mergeKey: "nudge", now: 0 },
      { type: "update", apply: increment, mergeKey: "nudge", now: 10 },
      { type: "update", apply: increment, mergeKey: "nudge", now: 20 },
    );
    expect(history.present).toBe(3);
    expect(apply(history, { type: "undo" }).present).toBe(0);
  });

  test("ドラッグ中の変更は確定時に1回分として記録する", () => {
    let history = apply(
      createHistory(0),
      { type: "preview", next: 1 },
      { type: "preview", next: 2 },
    );
    expect(history.past).toEqual([]);
    expect(canUndo(history)).toBe(true);
    history = apply(history, { type: "commitPreview" });
    expect(history.past).toEqual([0]);
    expect(apply(history, { type: "undo" }).present).toBe(0);
  });

  test("ドラッグ中に元に戻すと、ドラッグ前に戻る", () => {
    const history = apply(createHistory(0), { type: "preview", next: 1 }, { type: "undo" });
    expect(history.present).toBe(0);
  });

  test("履歴は上限で古いものから捨てる", () => {
    let history = createHistory(0);
    for (let index = 1; index <= historyLimit + 10; index++) {
      history = historyReducer(history, { type: "set", next: index, now: 0 });
    }
    expect(history.past).toHaveLength(historyLimit);
    expect(history.past[0]).toBe(10);
  });

  test("差し替えで履歴を捨てる", () => {
    const history = apply(
      createHistory(0),
      { type: "set", next: 1, now: 0 },
      { type: "reset", present: 9 },
    );
    expect(history).toEqual(createHistory(9));
  });
});
