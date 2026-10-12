// #############################################################################
// MARK: 型定義

/** 要素の位置と大きさ（px）。 */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

// #############################################################################
// MARK: 関数

/**
 * 要素の位置と大きさを、基準の要素の左上からの相対値（px）で測る。
 * 同じ文書の中の要素どうしで測るため、iframe の外側の拡大・縮小（transform）の影響は受けない。
 */
export function measureRelative(origin: Element, element: Element): Box {
  const base = origin.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left - base.left,
    top: rect.top - base.top,
    width: rect.width,
    height: rect.height,
  };
}
