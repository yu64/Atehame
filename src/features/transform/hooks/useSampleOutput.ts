import { schemaAtom } from "@src/features/schema";
import useTransformPreview from "@src/features/transform/hooks/useTransformPreview";
import { createTransformInput } from "@src/features/transform/model";
import { sampleRowAtom, transformCodeAtom } from "@src/features/transform/store";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

/** 編集中のスキーマ・加工コード・サンプル行から、加工結果を試算する。 */
export default function useSampleOutput() {
  const schema = useAtomValue(schemaAtom);
  const code = useAtomValue(transformCodeAtom);
  const sampleRow = useAtomValue(sampleRowAtom);

  const conversion = useMemo(() => createTransformInput(schema, sampleRow), [schema, sampleRow]);
  const preview = useTransformPreview(code, conversion.input);

  return { conversion, preview };
}
