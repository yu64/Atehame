import type { DataSchema } from "@src/features/schema/model";
import { atom } from "jotai";

/** 画面間で共有する編集中のスキーマ。リロード時には初期化される。 */
export const schemaAtom = atom<DataSchema>({
  version: 1,
  fields: [],
});
