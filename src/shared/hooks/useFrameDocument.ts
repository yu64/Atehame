import { useCallback, useRef, useState } from "react";

// #############################################################################
// MARK: フック

/**
 * iframe の読み込みを待ち、中の文書を返す。読み込み前は null。
 * 返した ref と onLoad を iframe に渡す。
 */
export function useFrameDocument() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const onLoad = useCallback(() => setDocument(ref.current?.contentDocument ?? null), []);
  return {
    ref,
    onLoad,
    document,
  };
}
