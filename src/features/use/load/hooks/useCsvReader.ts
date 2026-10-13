import { readCsvTable, type Template } from "@src/features/data";
import type { CsvSource, LoadedCsv } from "@src/features/use/data";
import { guessDelimiter, parseCsv } from "@src/shared/lib/csv";
import { fileReadErrorMessage } from "@src/shared/lib/error";
import { decodeText } from "@src/shared/lib/textFile";
import { formatBytes } from "@src/shared/lib/units";
import { useState } from "react";

// #############################################################################
// MARK: 定数

/** 読み込むファイルの大きさの上限（バイト）。はがきの宛名なら数万行でも収まる。 */
const maxCsvBytes = 10 * 1024 * 1024;

/** 貼り付けた表の文字数の上限。ファイルの上限と同じくらいの量にする。 */
const maxCsvLength = maxCsvBytes;

// #############################################################################
// MARK: フック

/**
 * CSV（ファイルか、貼り付けた表）を読み、見出しをテンプレートのカラムに対応させて知らせる。
 * ファイルの文字コードと、区切り文字（カンマかタブ）は自動で判定する。
 * 読めなかった場合は、読み込んだ内容を消して理由を返す。
 */
export function useCsvReader(template: Template, onLoad: (csv: LoadedCsv | undefined) => void) {
  const [error, setError] = useState<string>();

  /** 読めなかったことにする。 */
  function fail(message: string) {
    onLoad(undefined);
    setError(message);
  }

  /** 文字列を表として読む。 */
  function readText(text: string, source: CsvSource) {
    if (text.length > maxCsvLength) {
      fail(`大きすぎます（${maxCsvLength.toLocaleString()} 文字まで）。`);
      return;
    }
    const table = readCsvTable(template.schema, parseCsv(text, guessDelimiter(text)));
    setError(undefined);
    onLoad({
      ...table,
      source,
    });
  }

  /** ファイルを読む。 */
  async function readFile(file: File) {
    if (file.size > maxCsvBytes) {
      fail(`ファイルが大きすぎます（${formatBytes(maxCsvBytes)} まで）。`);
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      fail(fileReadErrorMessage);
      return;
    }
    const { text, encoding } = decodeText(bytes);
    readText(text, {
      kind: "file",
      fileName: file.name,
      encoding,
    });
  }

  /** 前の失敗の理由を消す。読み込んだ内容は残す。 */
  function clearError() {
    setError(undefined);
  }

  return {
    error,
    clearError,
    readText,
    readFile,
  };
}
