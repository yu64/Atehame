import type { CsvTable, Template } from "@src/features/data";
import type { TextEncoding } from "@src/shared/lib/textFile";
import { atom } from "jotai";

// #############################################################################
// MARK: 型定義

/** CSV の読み込み元。ファイルか、クリップボードから貼り付けた表。 */
export type CsvSource =
  | {
      kind: "file";
      fileName: string;
      encoding: TextEncoding;
    }
  | { kind: "paste" };

/** 読み込んだ CSV。 */
export interface LoadedCsv extends CsvTable {
  source: CsvSource;
}

// #############################################################################
// MARK: 状態

// どちらも保存しない（CSV には住所や氏名が入るため、ブラウザに残さない）。再読み込みしたら選び直す。

/** 使うテンプレート。編集中のテンプレートとは別に持ち、使うだけなら編集中の内容を上書きしない。 */
export const usingTemplateAtom = atom<Template | undefined>(undefined);

/** 読み込んだ CSV。 */
export const loadedCsvAtom = atom<LoadedCsv | undefined>(undefined);

/** テンプレートを選んで使い始める。前に読み込んだ CSV は捨てる。 */
export const startUsingAtom = atom(null, (_get, set, template: Template) => {
  set(usingTemplateAtom, template);
  set(loadedCsvAtom, undefined);
});
