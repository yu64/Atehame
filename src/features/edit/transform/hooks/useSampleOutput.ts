import { createTransformInput, transformPrelude } from "@src/features/data";
import { schemaAtom, transformCodeAtom } from "@src/features/edit/data";
import { sampleRowAtom } from "@src/features/edit/transform/store";
import { type ExecutionOutcome, useExecutions } from "@src/features/runtime";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

// #############################################################################
// MARK: 定数

/** 入力が落ち着いてから加工処理を実行する待ち時間（ミリ秒）。 */
const debounceMs = 300;

// #############################################################################
// MARK: フック

/** 編集中のスキーマ・加工コード・サンプル行から、加工結果を試算する。 */
export function useSampleOutput() {
  const schema = useAtomValue(schemaAtom);
  const code = useAtomValue(transformCodeAtom);
  const sampleRow = useAtomValue(sampleRowAtom);

  const conversion = useMemo(() => createTransformInput(schema, sampleRow), [schema, sampleRow]);
  const inputs = useMemo(() => [conversion.input], [conversion.input]);
  const { results } = useExecutions(code, inputs, {
    debounceMs,
    prelude: transformPrelude,
  });
  const preview: ExecutionOutcome = results[0] ?? { status: "pending" };

  return {
    conversion,
    preview,
  };
}
