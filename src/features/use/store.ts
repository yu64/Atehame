import type { Template } from "@src/features/template";
import { atom } from "jotai";

/** 使うテンプレート。編集中のテンプレートとは別に持ち、使うだけなら編集中の内容を上書きしない。 */
export const usingTemplateAtom = atom<Template | null>(null);
