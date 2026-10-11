import type { Layout } from "@src/features/designer";
import { createTemplate, type Template } from "@src/features/template/model";
import type { DataSchema } from "@src/features/template/schema";
import { atom, type SetStateAction, type WritableAtom } from "jotai";

/**
 * 編集中のテンプレート。アプリでこれ1つがテンプレート全体を持つ。
 * 各画面は、下の派生の atom で自分の工程の部分だけを読み書きする。リロード時には初期化される。
 */
const templateAtom = atom<Template>(createTemplate());

/** 編集を始めたか（新しく作った・読み込んだ・どこかを書き換えた）。 */
const editingAtom = atom(false);

/** テンプレートの一部を読み書きする atom。書き換えたら編集中にする。 */
function partAtom<T>(
  read: (template: Template) => T,
  write: (template: Template, value: T) => Template,
): WritableAtom<T, [SetStateAction<T>], void> {
  return atom(
    get => read(get(templateAtom)),
    (get, set, action: SetStateAction<T>) => {
      const template = get(templateAtom);
      const value =
        typeof action === "function" ? (action as (previous: T) => T)(read(template)) : action;
      set(templateAtom, write(template, value));
      set(editingAtom, true);
    },
  );
}

export const templateNameAtom = partAtom<string>(
  template => template.name,
  (template, name) => ({ ...template, name }),
);

export const schemaAtom = partAtom<DataSchema>(
  template => template.schema,
  (template, schema) => ({ ...template, schema }),
);

export const transformCodeAtom = partAtom<string>(
  template => template.transform.code,
  (template, code) => ({ ...template, transform: { code } }),
);

export const layoutAtom = partAtom<Layout>(
  template => template.layout,
  (template, layout) => ({ ...template, layout }),
);

/** 編集中のテンプレート全体（保存に使う）。 */
export const currentTemplateAtom = atom(get => get(templateAtom));

/** 編集中の内容があるか（「続きから編集」を出すかの判断に使う）。 */
export const hasDraftAtom = atom(get => get(editingAtom));

/** 空のテンプレートで編集を始める。編集中の内容は破棄する。 */
export const startNewTemplateAtom = atom(null, (_get, set) => {
  set(templateAtom, createTemplate());
  set(editingAtom, true);
});

/** 読み込んだテンプレートで編集を始める。編集中の内容は破棄する。 */
export const startTemplateAtom = atom(null, (_get, set, template: Template) => {
  set(templateAtom, template);
  set(editingAtom, true);
});
