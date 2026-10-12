import { useTransformPreview } from "@src/features/edit/transform/hooks/useTransformPreview";
import { createTransformInput } from "@src/features/edit/transform/model";
import { sampleRowAtom } from "@src/features/edit/transform/store";
import { schemaAtom, transformCodeAtom } from "@src/features/template";
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

  return { conversion, preview };
}
