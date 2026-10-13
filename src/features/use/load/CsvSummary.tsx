import type { Template } from "@src/features/data";
import type { CsvSource, LoadedCsv } from "@src/features/use/data";
import type { TextEncoding } from "@src/shared/lib/textFile";
import { Alert } from "@src/shared/ui/Alert";

// #############################################################################
// MARK: 型定義

export interface Props {
  template: Template;
  csv: LoadedCsv;
}

// #############################################################################
// MARK: 定数

/** 表で見せる行の数（確認用。全部の行は次の画面で見る）。 */
const previewRowCount = 5;

const encodingLabels: Record<TextEncoding, string> = {
  "utf-8": "UTF-8",
  shift_jis: "Shift_JIS",
};

// #############################################################################
// MARK: コンポーネント

/** 読み込んだ CSV の結果。足りないカラムや使わない列を知らせ、先頭の数行を表で見せる。 */
export function CsvSummary(props: Props) {
  const { csv } = props;
  const fields = props.template.schema.fields.filter(
    field => field.name !== "" && !csv.missing.includes(field.name),
  );
  const shown = csv.rows.slice(0, previewRowCount);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-secondary">
        {sourceLabel(csv.source)}・{csv.rows.length} 行
      </p>
      {csv.missing.length > 0 && (
        <Alert
          kind="error"
          messages={[
            `見出しに、次のカラムがありません: ${csv.missing.join("、")}`,
            "見出しをテンプレートのカラム名にそろえてから、読み込み直してください。",
          ]}
        />
      )}
      {csv.rows.length === 0 && (
        <Alert kind="warning" messages={["見出しの下に、データの行がありません。"]} />
      )}
      {csv.extra.length > 0 && (
        <Alert
          kind="info"
          messages={[`次の列はテンプレートにないため、使いません: ${csv.extra.join("、")}`]}
        />
      )}

      {shown.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-surface-border">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>行</th>
                {fields.map(field => (
                  <th key={field.id}>{field.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, index) => (
                <tr key={index}>
                  <td className="text-text-tertiary">{index + 1}</td>
                  {fields.map(field => (
                    <td key={field.id} className="whitespace-pre-wrap">
                      {row[field.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {csv.rows.length > shown.length && (
            <p className="px-3 py-2 text-xs text-text-tertiary">
              ほか {csv.rows.length - shown.length} 行。すべての行は次の画面で確かめられます。
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// #############################################################################
// MARK: 内部関数

/** 読み込み元の表示（ファイル名と文字コード、または貼り付け）。 */
function sourceLabel(source: CsvSource): string {
  return (
    (source.kind === "file")
    ? `${source.fileName}（${encodingLabels[source.encoding]}）`
    : "貼り付けたデータ"
  );
}
