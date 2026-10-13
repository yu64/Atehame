import type { RowCells, SchemaField } from "@src/features/data";
import type { RowResult } from "@src/features/use/preview/hooks/useTransformRows";

// #############################################################################
// MARK: 型定義

export interface Props {
  rows: RowCells[];
  results: RowResult[];
  /** 行を見分けるために表示するカラム。 */
  fields: SchemaField[];
  /** 印刷する行か。 */
  isChecked: (index: number) => boolean;
  onCheck: (index: number, checked: boolean) => void;
  /** プレビューしている行。 */
  current: number;
  onSelect: (index: number) => void;
}

// #############################################################################
// MARK: コンポーネント

/** CSV の行の一覧。加工の結果と、印刷するかのチェック。行を押すとプレビューする。 */
export function RowList(props: Props) {
  return (
    <div className="overflow-auto rounded-lg border border-surface-border">
      <table className="table table-sm">
        <thead className="sticky top-0 bg-surface">
          <tr>
            <th className="w-8">
              <span className="sr-only">印刷する</span>
            </th>
            <th className="w-10">行</th>
            <th className="w-16">状態</th>
            {props.fields.map(field => (
              <th key={field.id}>{field.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((cells, index) => {
            const result = props.results[index] ?? { status: "pending" };
            return (
              <tr
                key={index}
                className={`cursor-pointer ${index === props.current ? "bg-surface-hover" : ""}`}
                onClick={() => props.onSelect(index)}
              >
                <td onClick={event => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    aria-label={`${index + 1} 行目を印刷する`}
                    disabled={result.status !== "success"}
                    checked={props.isChecked(index)}
                    onChange={event => props.onCheck(index, event.currentTarget.checked)}
                  />
                </td>
                <td className="text-text-tertiary">{index + 1}</td>
                <td>
                  <ResultStatus result={result} />
                </td>
                {props.fields.map(field => (
                  <td key={field.id} className="max-w-48 truncate">
                    {cells[field.id]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// #############################################################################
// MARK: 内部部品

/** 加工の結果の状態。エラーと注意は、内容をツールチップで見せる。 */
function ResultStatus(props: { result: RowResult }) {
  const { result } = props;
  if (result.status === "pending") {
    return <span className="text-xs text-text-tertiary">加工中</span>;
  }
  if (result.status === "error") {
    return (
      <span className="text-xs text-status-error" title={result.message}>
        エラー
      </span>
    );
  }
  if (result.warnings.length > 0) {
    return (
      <span className="text-xs text-status-warning" title={result.warnings.join("\n")}>
        注意
      </span>
    );
  }
  return <span className="text-xs text-status-success">OK</span>;
}
