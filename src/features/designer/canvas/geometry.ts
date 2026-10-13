import { canvasPadding } from "@src/features/designer/canvas/units";
import type { PageSize } from "@src/features/designer/layoutCss";
import type { ElementRect } from "@src/features/designer/state/operations";
import { pxPerMm } from "@src/shared/lib/units";

// #############################################################################
// MARK: 定数

/** 用紙全体を表示するときの、拡大率の下限と上限。 */
const minFitZoom = 0.1;
const maxFitZoom = 3;

// #############################################################################
// MARK: 関数

/**
 * 用紙全体が、キャンバスの領域（px）に余白を残して収まる拡大率。
 * 0.01 刻みに切り捨て（はみ出さない側に寄せる）、下限と上限の間に収める。
 */
export function fitZoom(area: { width: number; height: number }, paper: PageSize): number {
  const width = area.width - canvasPadding * 2;
  const height = area.height - canvasPadding * 2;
  const fit = Math.min(width / (paper.width * pxPerMm), height / (paper.height * pxPerMm));
  return Math.max(minFitZoom, Math.min(maxFitZoom, Math.floor(fit * 100) / 100));
}

/**
 * 表示上の px を mm に直す。unit は 1mm あたりの表示上の px（拡大率を含む）。
 * snap（1mm 刻み）のときは、整数の mm に丸める。
 */
export function pxToMm(px: number, unit: number, snap: boolean): number {
  const mm = px / unit;
  return (snap ? Math.round(mm) : mm);
}

/**
 * 大きさを変えている途中の枠（表示上の px）を、mm の位置と大きさにする。
 * snap（1mm 刻み）のときは、幅や高さではなく四辺をそれぞれ 1mm の位置に合わせる。
 * 幅と高さは 1mm より小さくしない。
 */
export function resizedRect(
  box: { left: number; top: number; width: number; height: number },
  unit: number,
  snap: boolean,
): ElementRect {
  const left = pxToMm(box.left, unit, snap);
  const top = pxToMm(box.top, unit, snap);
  return {
    left,
    top,
    width: Math.max(pxToMm(box.left + box.width, unit, snap) - left, 1),
    height: Math.max(pxToMm(box.top + box.height, unit, snap) - top, 1),
  };
}
