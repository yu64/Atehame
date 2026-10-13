import { loadStandardTemplate, type StandardTemplate, type Template } from "@src/features/data";
import { errorMessage } from "@src/shared/lib/error";
import { useState } from "react";

// #############################################################################
// MARK: フック

/** 標準テンプレートの中身を読み込む。読み込み中かどうかと、失敗の理由も返す。 */
export function useStandardTemplateLoader() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  /** 読み込む。失敗したら理由を残し、undefined を返す。 */
  async function load(standard: StandardTemplate): Promise<Template | undefined> {
    setLoading(true);
    setError(undefined);
    try {
      return await loadStandardTemplate(standard);
    } catch (caught) {
      setError(`「${standard.title}」を読み込めませんでした: ${errorMessage(caught)}`);
      return undefined;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    load,
  };
}
