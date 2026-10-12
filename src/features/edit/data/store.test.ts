import { createTemplate } from "@src/features/data";
import {
  currentTemplateAtom,
  hasDraftAtom,
  layoutAtom,
  schemaAtom,
  startNewTemplateAtom,
  startTemplateAtom,
  templateNameAtom,
  transformCodeAtom,
} from "@src/features/edit/data/store";
import { createStore } from "jotai";
import { describe, expect, test } from "vitest";

describe("編集中のテンプレート", () => {
  test("各工程の atom は、テンプレート全体の一部を読み書きする", () => {
    const store = createStore();
    expect(store.get(hasDraftAtom)).toBe(false);

    store.set(templateNameAtom, "年賀状");
    store.set(schemaAtom, current => ({
      ...current,
      fields: [
        {
          id: "f",
          name: "氏名",
          type: "string",
          memo: "",
        },
      ],
    }));
    store.set(transformCodeAtom, "return input;");

    expect(store.get(currentTemplateAtom)).toMatchObject({
      name: "年賀状",
      schema: { fields: [{ name: "氏名" }] },
      transform: { code: "return input;" },
    });
    expect(store.get(hasDraftAtom)).toBe(true);
  });

  test("読み込むと全体を入れ替え、新しく作ると空に戻す", () => {
    const store = createStore();
    const loaded = {
      ...createTemplate(),
      name: "読み込んだ",
    };
    store.set(startTemplateAtom, loaded);
    expect(store.get(currentTemplateAtom)).toBe(loaded);
    expect(store.get(layoutAtom)).toBe(loaded.layout);
    expect(store.get(hasDraftAtom)).toBe(true);

    store.set(startNewTemplateAtom);
    expect(store.get(templateNameAtom)).toBe("");
    expect(store.get(schemaAtom).fields).toEqual([]);
  });
});
