import type { DataSchema } from "@src/models/DataSchema";
import { atom } from "jotai";

/** 画面間で共有する編集中のスキーマ。リロード時には初期化される。 */
export const schemaAtom = atom<DataSchema>({
  version: 1,
  fields: [],
});
