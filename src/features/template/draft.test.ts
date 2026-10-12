// @vitest-environment happy-dom
import { createTemplate } from "@src/features/template/model";
import { createStore } from "jotai";
import { beforeEach, describe, expect, test, vi } from "vitest";

const draftStorageKey = "atehame:draft";

/** 自動保存した内容は、ページを開いたとき（モジュールを読み込んだとき）に読む。テストでは毎回読み込み直す。 */
async function loadStore() {
  vi.resetModules();
  return import("@src/features/template/store");
}

describe("編集中のテンプレートの自動保存", () => {
  beforeEach(() => localStorage.clear());

  test("保存してあった内容から、続きを始める", async () => {
    const template = { ...createTemplate(), name: "年賀状" };
    localStorage.setItem(draftStorageKey, JSON.stringify({ template, editing: true }));
    const { templateNameAtom, hasDraftAtom } = await loadStore();
    const store = createStore();
    expect(store.get(templateNameAtom)).toBe("年賀状");
    expect(store.get(hasDraftAtom)).toBe(true);
  });

  test("壊れた内容は使わず、空のテンプレートで始める", async () => {
    localStorage.setItem(draftStorageKey, JSON.stringify({ template: { name: 1 }, editing: true }));
    const { templateNameAtom, hasDraftAtom } = await loadStore();
    const store = createStore();
    expect(store.get(templateNameAtom)).toBe("");
    expect(store.get(hasDraftAtom)).toBe(false);
  });

  test("書き換えると、少し待ってから保存する", async () => {
    const { schemaAtom } = await loadStore();
    vi.useFakeTimers();
    const store = createStore();
    store.set(schemaAtom, schema => ({
      ...schema,
      fields: [{ id: "f", name: "氏名", type: "string", memo: "" }],
    }));
    vi.advanceTimersByTime(1000);
    const saved = JSON.parse(localStorage.getItem(draftStorageKey) ?? "null");
    expect(saved.template.schema.fields[0].name).toBe("氏名");
    expect(saved.editing).toBe(true);
    vi.useRealTimers();
  });
});
