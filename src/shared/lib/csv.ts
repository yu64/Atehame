// #############################################################################
// MARK: 型定義

/** セルの区切り文字。 */
export type CsvDelimiter = "," | "\t";

// #############################################################################
// MARK: 関数

/**
 * CSV の文字列を、行とセルの2次元配列にする（RFC 4180）。
 * ダブルクォートで囲んだセルは、区切り文字・改行・`""`（ダブルクォート1つ）を含められる。
 * 改行は CRLF・LF・CR のどれでもよい。末尾の改行の後は行として扱わない。
 * delimiter をタブにすると、Excel などからコピーした表（タブ区切り）も読める。
 */
export function parseCsv(text: string, delimiter: CsvDelimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let index = 0;

  /** 今のセルを行に加える。 */
  function endCell() {
    row.push(cell);
    cell = "";
  }

  /** 今の行を表に加える。 */
  function endRow() {
    endCell();
    rows.push(row);
    row = [];
  }

  while (index < text.length) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 2;
        continue;
      }
      if (char === '"') quoted = false;
      else cell += char;
      index += 1;
      continue;
    }

    if (char === '"' && cell === "") quoted = true;
    else if (char === delimiter) endCell();
    else if (char === "\r" || char === "\n") {
      endRow();
      if (char === "\r" && text[index + 1] === "\n") index += 1;
    } else cell += char;
    index += 1;
  }

  if (cell !== "" || row.length > 0 || quoted) endRow();
  return rows;
}

/**
 * 区切り文字を推測する。1行目にタブがあればタブ区切り（表計算ソフトからコピーした表）、なければカンマ。
 */
export function guessDelimiter(text: string): CsvDelimiter {
  const firstLine = text.split(/\r\n|\r|\n/, 1)[0] ?? "";
  return (firstLine.includes("\t") ? "\t" : ",");
}

/** 2次元配列を CSV の文字列にする。必要なセルだけダブルクォートで囲み、改行は CRLF にする。 */
export function stringifyCsv(rows: string[][]): string {
  return rows.map(row => row.map(quoteCell).join(",")).join("\r\n") + "\r\n";
}

// #############################################################################
// MARK: 内部関数

/** カンマ・ダブルクォート・改行を含むセルは、ダブルクォートで囲む。 */
function quoteCell(cell: string): string {
  return (/[",\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell);
}
