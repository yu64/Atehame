import { createLayout, type Layout } from "@src/features/designer";
import { atom } from "jotai";

/** 画面間で共有する編集中のレイアウト。リロード時には初期化される。 */
export const layoutAtom = atom<Layout>(createLayout("hagaki"));
