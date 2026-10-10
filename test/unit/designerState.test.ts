import {
  addFromPreset,
  duplicateElement,
  moveElementBy,
  placeElement,
  uniqueName,
} from "@src/components/designer/state/operations";
import {
  canRedo,
  canUndo,
  createHistory,
  historyLimit,
  historyReducer,
  mergeWindowMs,
  type History,
  type HistoryAction,
} from "@src/components/designer/state/history";
import { postalCodePreset, textPreset } from "@src/components/designer/presets";
import { decodeCssString, LayoutDocument, textProperty } from "@src/logic/layoutCss";
import { createLayout } from "@src/models/Layout";
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

describe("デザイナーの操作", () => {
  const paper = { width: 100, height: 148 };
  const base = LayoutDocument.from(createLayout("hagaki").css);

  test("名前の重複を避ける", () => {
    expect(uniqueName(["氏名", "氏名 2"], "氏名")).toBe("氏名 3");
    expect(uniqueName([], " ")).toBe("部品");
  });

  test("値の名前から、その値を埋め込んだテキストを追加する", () => {
    const { layout, name } = addFromPreset(base, textPreset, {
      key: "氏名",
      fields: ["氏名"],
      paper,
    });
    const rule = layout.elements[0];
    expect(name).toBe("氏名");
    expect(decodeCssString(rule.declarations.get(textProperty)!.value)).toBe("{氏名}");
    expect(rule.declarations.get("writing-mode")?.value).toBe("vertical-rl");
  });

  test("同じ値をもう一度追加すると名前に番号を付ける", () => {
    const first = addFromPreset(base, textPreset, { key: "氏名", fields: [], paper });
    const second = addFromPreset(first.layout, textPreset, { key: "氏名", fields: [], paper });
    expect(second.name).toBe("氏名 2");
  });

  test("郵便番号枠は1文字ずつ分け、郵便番号らしい値を埋め込む", () => {
    const { layout } = addFromPreset(base, postalCodePreset, {
      fields: ["氏名", "郵便番号"],
      paper,
    });
    const rule = layout.elements[0];
    expect(rule.name).toBe("郵便番号");
    expect(rule.declarations.get("--atehame-split")?.value).toBe("char");
    expect(rule.declarations.get("font-family")?.value).toBe("var(--atehame-font-mincho)");
    expect(layout.css).toContain('  & > [data-part="char"]:nth-child(4) {');
    // 各桁の調整は部品の規則の中にあるため、部品を消せば残らない。
    expect(layout.removeElement("郵便番号").css).toBe(base.css);
  });

  test("位置を設定し、ずらす", () => {
    let { layout } = addFromPreset(base, textPreset, { key: "a", fields: [], paper });
    layout = placeElement(layout, "a", { left: 10, top: 20 });
    layout = moveElementBy(layout, "a", 0.5, -1, undefined);
    const rule = layout.elements[0];
    expect(rule.declarations.get("left")?.value).toBe("10.5mm");
    expect(rule.declarations.get("top")?.value).toBe("19mm");
  });

  test("位置が mm で読めない場合は表示上の位置からずらす", () => {
    const layout = LayoutDocument.from('[data-name="a"] { left: 50%; }');
    const moved = moveElementBy(layout, "a", 1, 1, { left: 30, top: 40, width: 1, height: 1 });
    expect(moved.elements[0].declarations.get("left")?.value).toBe("31mm");
    expect(moved.elements[0].declarations.get("top")?.value).toBe("41mm");
  });

  test("複製は名前を変えてずらす", () => {
    const layout = LayoutDocument.from('[data-name="a"] { left: 10mm; top: 10mm; color: red; }');
    const result = duplicateElement(layout, "a", undefined);
    const copy = result.layout.elements[1];
    expect(result.name).toBe("a のコピー");
    expect(copy.declarations.get("left")?.value).toBe("13mm");
    expect(copy.declarations.get("color")?.value).toBe("red");
  });
});
