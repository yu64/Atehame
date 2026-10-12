import type { RowCells } from "@src/features/data";
import { atom } from "jotai";

// #############################################################################
// MARK: 状態

/** 加工結果を確認するためのサンプル行。フィールドIDからセルの文字列を引く。テンプレートには保存しない。 */
export const sampleRowAtom = atom<RowCells>({});
