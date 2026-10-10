import { createLayout, type Layout } from "@src/models/Layout";
import { atom } from "jotai";

/** 画面間で共有する編集中のレイアウト。リロード時には初期化される。 */
export const layoutAtom = atom<Layout>(createLayout("hagaki"));

/** 保存するテンプレートの名前。 */
export const templateNameAtom = atom<string>("");
