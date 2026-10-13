import { createTransformInput, type RowCells, type Template } from "@src/features/data";
import type { Values } from "@src/features/designer";
import { type ExecutionOutcome, useExecutions } from "@src/features/runtime";
import type { JsonValue } from "@src/shared/lib/json";
import { useMemo } from "react";

// #############################################################################
// MARK: 型定義

/** 1行の加工の結果。 */
export type RowResult =
  | { status: "pending" }
  | {
      status: "success";
      /** レイアウトに入れる値。 */
      values: Values;
      /** 値の問題（型に合わないなど）。加工は行い、値は null として渡している。 */
      warnings: string[];
    }
  | {
      status: "error";
      message: string;
    };

export interface TransformRows {
  results: RowResult[];
  /** 加工し終えた行の数。 */
  done: number;
}

// #############################################################################
// MARK: フック

/** CSV の全行に加工のコードを実行する。結果は少しずつ反映される。 */
export function useTransformRows(template: Template, rows: RowCells[]): TransformRows {
  const conversions = useMemo(
    () => rows.map(cells => createTransformInput(template.schema, cells)),
    [template.schema, rows],
  );
  const inputs = useMemo(() => conversions.map(conversion => conversion.input), [conversions]);
  const { results, done } = useExecutions(template.transform.code, inputs);

  const rowResults = useMemo(() => {
    const fieldNames = new Map(template.schema.fields.map(field => [field.id, field.name]));
    return conversions.map((conversion, index) => {
      const warnings = conversion.problems
        .filter(problem => problem.kind === "value")
        .map(problem => `${fieldNames.get(problem.fieldId ?? "") ?? ""}: ${problem.message}`);
      return toRowResult(results[index], warnings);
    });
  }, [template.schema, conversions, results]);

  return {
    results: rowResults,
    done,
  };
}

// #############################################################################
// MARK: 内部関数

/** 実行の結果を、行の結果にする。レイアウトに渡せない出力（オブジェクトでない）はエラーにする。 */
function toRowResult(outcome: ExecutionOutcome | undefined, warnings: string[]): RowResult {
  if (!outcome || outcome.status === "pending") return { status: "pending" };
  if (outcome.status === "error") {
    return {
      status: "error",
      message: outcome.message,
    };
  }
  if (!isValues(outcome.output)) {
    return {
      status: "error",
      message: "加工の結果がオブジェクトではないため、レイアウトに渡せません。",
    };
  }
  return {
    status: "success",
    values: outcome.output,
    warnings,
  };
}

/** レイアウトに渡せる値（配列でないオブジェクト）か。 */
function isValues(value: JsonValue): value is Values {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
