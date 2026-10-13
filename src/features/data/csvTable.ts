import { safeFileBaseName } from "@src/features/data/model";
import { type DataSchema, inputFields, normalizeFieldName } from "@src/features/data/schema";
import type { RowCells } from "@src/features/data/transformInput";
import { stringifyCsv } from "@src/shared/lib/csv";

// #############################################################################
// MARK: 型定義

/** CSV の表を、スキーマのカラムに対応させた結果。 */
export interface CsvTable {
  /** 見出しの次の行から。フィールド ID からセルの文字列を引く。空の行は除く。 */
  rows: RowCells[];
  /** CSV の見出しにない、スキーマのカラム名。 */
  missing: string[];
  /** スキーマにない、CSV の見出し（使わない）。 */
  extra: string[];
}

// #############################################################################
// MARK: 関数

/**
 * CSV の表（1行目が見出し）を、スキーマのカラムに名前で対応させる。
 * 名前が空のカラムと、名前が重複したカラムの2つ目以降は対応させない（加工の input にも入らないため）。
 * CSV の見出しが重複している場合は、最初の列を使う。
 */
export function readCsvTable(schema: DataSchema, table: string[][]): CsvTable {
  const [header = [], ...body] = table;
  const headerNames = header.map(normalizeFieldName);
  const columns = inputFields(schema).map(field => ({
    field,
    index: headerNames.indexOf(field.name),
  }));

  const rows = body
    .filter(cells => cells.some(cell => cell.trim() !== ""))
    .map(cells =>
      Object.fromEntries(
        columns
          .filter(column => column.index >= 0)
          .map(column => [column.field.id, cells[column.index] ?? ""]),
      ),
    );
  const names = new Set(columns.map(column => column.field.name));

  return {
    rows,
    missing: columns.filter(column => column.index < 0).map(column => column.field.name),
    extra: headerNames.filter(name => name !== "" && !names.has(name)),
  };
}

/** ひな形の CSV のファイル名。 */
export function csvTemplateFileName(templateName: string): string {
  return `${safeFileBaseName(templateName)}.csv`;
}

/**
 * スキーマのカラム名を見出しにした、空の CSV（ひな形）。
 * Excel で開いたときに文字化けしないよう、UTF-8 の BOM を付ける。
 */
export function createCsvTemplate(schema: DataSchema): string {
  return "\uFEFF" + stringifyCsv([inputFields(schema).map(field => field.name)]);
}
