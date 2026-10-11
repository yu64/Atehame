import type { RowCells } from "@src/features/transform/model";
import { atom } from "jotai";

/** 加工結果を確認するためのサンプル行。フィールドIDからセルの文字列を引く。テンプレートには保存しない。 */
export const sampleRowAtom = atom<RowCells>({});
