import type { DataSchema } from "@src/features/data";
import { createTemplate, parseTemplate, type Template } from "@src/features/data";
import type { Layout } from "@src/features/designer";
import { createPersistentStorage } from "@src/shared/lib/persistentStorage";
import { atom, type SetStateAction, type WritableAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// #############################################################################
// MARK: 自動保存

/** 編集中の内容。テンプレートと、編集を始めたか（新しく作った・読み込んだ・どこかを書き換えた）。 */
interface Draft {
  template: Template;
  editing: boolean;
}

/** 自動保存の localStorage のキー。 */
export const draftStorageKey = "atehame:draft";

const draftStorage = createPersistentStorage<Draft>({
  parse: value => {
    if (typeof value !== "object" || value === null) return undefined;
    const { template, editing } = value as Partial<Draft>;
    const parsed = parseTemplate(template);
    return (
      (parsed && typeof editing === "boolean")
      ? {
        template: parsed,
        editing,
      }
      : undefined
    );
  },
  // 画像が大きく、端末の保存領域に入りきらない場合など。画面の操作はそのまま続けられる。
  onError: error => console.warn("編集中のテンプレートを自動保存できませんでした。", error),
});

/**
 * 編集中の内容。アプリでこれ1つがテンプレート全体を持ち、localStorage に自動で保存する。
 * 再読み込みやブラウザを閉じても、次に開いたときに続きから編集できる。
 */
const draftAtom = atomWithStorage<Draft>(
  draftStorageKey,
  {
    template: createTemplate(),
    editing: false,
  },
  draftStorage,
  { getOnInit: true },
);

// #############################################################################
// MARK: テンプレート全体

/**
 * 編集中のテンプレート全体（保存に使う）。
 * 各画面は、下の派生の atom で自分の工程の部分だけを読み書きする。
 */
export const currentTemplateAtom = atom(get => get(draftAtom).template);

/** 編集中の内容があるか（「続きから編集」を出すかの判断に使う）。 */
export const hasDraftAtom = atom(get => get(draftAtom).editing);

// #############################################################################
// MARK: 工程ごとの部分

/** テンプレートの一部を読み書きする atom。書き換えたら編集中にする。 */
function partAtom<T>(
  read: (template: Template) => T,
  write: (template: Template, value: T) => Template,
): WritableAtom<T, [SetStateAction<T>], void> {
  return atom(
    get => read(get(currentTemplateAtom)),
    (get, set, action: SetStateAction<T>) => {
      const template = get(currentTemplateAtom);
      const value = (
        (typeof action === "function")
        ? (action as (previous: T) => T)(read(template))
        : action
      );
      set(draftAtom, {
        template: write(template, value),
        editing: true,
      });
    },
  );
}

export const templateNameAtom = partAtom<string>(
  template => template.name,
  (template, name) => ({
    ...template,
    name,
  }),
);

export const schemaAtom = partAtom<DataSchema>(
  template => template.schema,
  (template, schema) => ({
    ...template,
    schema,
  }),
);

export const transformCodeAtom = partAtom<string>(
  template => template.transform.code,
  (template, code) => ({
    ...template,
    transform: { code },
  }),
);

export const layoutAtom = partAtom<Layout>(
  template => template.layout,
  (template, layout) => ({
    ...template,
    layout,
  }),
);

// #############################################################################
// MARK: 編集の始め方

/** 渡したテンプレートで編集を始める。編集中の内容は破棄する。 */
export const startTemplateAtom = atom(null, (_get, set, template: Template) => {
  set(draftAtom, {
    template,
    editing: true,
  });
});

/** 空のテンプレートで編集を始める。編集中の内容は破棄する。 */
export const startNewTemplateAtom = atom(null, (_get, set) => {
  set(startTemplateAtom, createTemplate());
});
