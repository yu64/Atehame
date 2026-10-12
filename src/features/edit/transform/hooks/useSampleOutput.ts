import { createTransformInput } from "@src/features/data";
import { schemaAtom, transformCodeAtom } from "@src/features/edit/data";
import { useTransformPreview } from "@src/features/edit/transform/hooks/useTransformPreview";
import { sampleRowAtom } from "@src/features/edit/transform/store";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

// #############################################################################
// MARK: フック

/** 編集中のスキーマ・加工コード・サンプル行から、加工結果を試算する。 */
export function useSampleOutput() {
  const schema = useAtomValue(schemaAtom);
  const code = useAtomValue(transformCodeAtom);
  const sampleRow = useAtomValue(sampleRowAtom);

  const conversion = useMemo(() => createTransformInput(schema, sampleRow), [schema, sampleRow]);
  const preview = useTransformPreview(code, conversion.input);

  return {
    conversion,
    preview,
  };
}
