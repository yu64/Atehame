import type { RowCells } from "@src/features/transform/model";
import { atom } from "jotai";

export const defaultTransformCode = `// input: CSVの1行（カラム名 → 値）
// return: レイアウトに渡す値（JSONデータ）
return {
  ...input,
};
`;

/** 画面間で共有する編集中の加工コード。リロード時には初期化される。 */
export const transformCodeAtom = atom<string>(defaultTransformCode);

/** 加工結果を確認するためのサンプル行。フィールドIDからセルの文字列を引く。 */
export const sampleRowAtom = atom<RowCells>({});
