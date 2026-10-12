import { LayoutDocument } from "@src/features/designer/layoutCss";
import { imagePreset, textPreset } from "@src/features/designer/presets";
import { DesignerStore } from "@src/features/designer/state/designerStore";
import { describe, expect, test, vi } from "vitest";

const base = '@page { size: 100mm 148mm; }\n\n[data-name="a"] {\n  left: 10mm;\n  top: 10mm;\n}\n';

function createStore(css = base) {
  const onCommit = vi.fn<(layout: LayoutDocument) => void>();
  const store = new DesignerStore(LayoutDocument.from(css), onCommit);
  return { store, onCommit };
}

describe("デザイナーの状態", () => {
  test("確定した変更だけを知らせる", () => {
    const { store, onCommit } = createStore();
    store.setDeclaration("a", "color", "red");
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.lastCall?.[0].css).toContain("color: red");
  });

  test("ドラッグ中は知らせず、確定したら1回分として記録する", () => {
    const { store, onCommit } = createStore();
    store.preview("a", { left: 15 });
    store.preview("a", { left: 20 });
    expect(onCommit).not.toHaveBeenCalled();
    store.commitPreview();
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(store.layout.element("a")?.declarations.get("left")?.value).toBe("20mm");
    store.undo();
    expect(store.layout.element("a")?.declarations.get("left")?.value).toBe("10mm");
  });

  test("追加すると選択して設定タブを開く。1回の変更として知らせる", () => {
    const { store, onCommit } = createStore();
    store.setTab("css");
    store.add(textPreset, [], "氏名");
    expect(store.getState().selected).toBe("氏名");
    expect(store.getState().tab).toBe("properties");
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test("選択中の部品がなくなったら選択を外す", () => {
    const { store } = createStore();
    store.select("a");
    store.remove("a");
    expect(store.getState().selected).toBeUndefined();
    store.undo();
    store.select("a");
    store.setCss("@page { size: 100mm 148mm; }");
    expect(store.getState().selected).toBeUndefined();
  });

  test("名前を変えると選択も追う", () => {
    const { store } = createStore();
    store.select("a");
    store.rename("a", "b");
    expect(store.getState().selected).toBe("b");
    expect(store.layout.element("b")).toBeDefined();
  });

  test("名前を変えて元に戻しても、同じ部品を選んだまま。続けて変えた名前は1回で戻せる", () => {
    const { store } = createStore();
    store.select("a");
    const id = store.getState().selectedId;
    store.rename("a", "ab");
    store.rename("ab", "abc");
    expect(store.getState()).toMatchObject({ selectedId: id, selected: "abc" });

    store.undo();
    expect(store.getState()).toMatchObject({ selectedId: id, selected: "a" });
    store.redo();
    expect(store.getState()).toMatchObject({ selectedId: id, selected: "abc" });
  });

  test("部品を消したら選択を外し、元に戻しても選び直さない", () => {
    const { store } = createStore();
    store.select("a");
    store.remove("a");
    expect(store.getState()).toMatchObject({ selectedId: undefined, selected: undefined });
    store.undo();
    expect(store.getState().selected).toBeUndefined();
    store.select("a");
    expect(store.getState().selected).toBe("a");
  });

  test("CSS タブで部品の規則の行を表示する", () => {
    const { store } = createStore();
    store.showCss("a");
    expect(store.getState().tab).toBe("css");
    expect(store.getState().cssReveal?.line).toBe(3);
  });

  test("外から別の CSS が来たら履歴を捨てて受け取る。知らせた CSS なら何もしない", () => {
    const { store } = createStore();
    store.setDeclaration("a", "color", "red");
    const committed = store.layout;
    store.receive(LayoutDocument.from(committed.css));
    expect(store.layout).toBe(committed);
    expect(store.canUndo()).toBe(true);

    store.receive(LayoutDocument.from("@page { size: 120mm 235mm; }"));
    expect(store.paperSize()).toEqual({ width: 120, height: 235 });
    expect(store.canUndo()).toBe(false);
  });

  test("状態が変わったときだけ購読者に知らせる", () => {
    const { store } = createStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setDeclaration("a", "left", "10mm");
    expect(listener).not.toHaveBeenCalled();
    store.setZoom(2);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.setZoom(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("画像の登録・名前の変更・削除は、元に戻せる", () => {
    const { store } = createStore();
    const png = { type: "image/png", data: "iVBORw0KGgo=" } as const;
    store.setAsset("logo", png);
    store.renameAsset("logo", "印影");
    expect(Object.keys(store.layout.assets)).toEqual(["印影"]);
    store.undo();
    expect(Object.keys(store.layout.assets)).toEqual(["logo"]);
    store.removeAsset("logo");
    expect(store.layout.assets).toEqual({});
    store.undo();
    expect(store.layout.assets).toEqual({ logo: png });
  });

  test("画像が必要な雛形は、画像がなければ追加せずに画像タブを開く", () => {
    const { store, onCommit } = createStore();
    store.add(imagePreset, []);
    expect(store.getState().tab).toBe("assets");
    expect(onCommit).not.toHaveBeenCalled();

    store.setAsset("logo", { type: "image/png", data: "iVBORw0KGgo=" });
    store.add(imagePreset, []);
    expect(store.getState().selected).toBe("画像");
    expect(store.layout.assetUsage("logo")).toEqual(["画像"]);
  });
});
