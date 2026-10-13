import { fitZoom, pxToMm, resizedRect } from "@src/features/designer/canvas/geometry";
import { canvasPadding } from "@src/features/designer/canvas/units";
import { pxPerMm } from "@src/shared/lib/units";
import { describe, expect, test } from "vitest";

/** 用紙がちょうど zoom 倍で収まる領域の大きさ（余白を含む）。 */
function areaFor(paperMm: number, zoom: number) {
  return paperMm * pxPerMm * zoom + canvasPadding * 2;
}

describe("用紙全体を表示する拡大率", () => {
  const paper = {
    width: 100,
    height: 148,
  };

  test("幅と高さのうち、きついほうに合わせる", () => {
    const wide = {
      width: areaFor(100, 3),
      height: areaFor(148, 1.505),
    };
    expect(fitZoom(wide, paper)).toBe(1.5);
    const tall = {
      width: areaFor(100, 0.755),
      height: areaFor(148, 3),
    };
    expect(fitZoom(tall, paper)).toBe(0.75);
  });

  test("0.01 刻みに切り捨てる（はみ出さない側に寄せる）", () => {
    const area = {
      width: areaFor(100, 1.239),
      height: areaFor(148, 3),
    };
    expect(fitZoom(area, paper)).toBe(1.23);
  });

  test("下限と上限の間に収める。領域が余白より小さくても下限にする", () => {
    const huge = {
      width: areaFor(100, 10),
      height: areaFor(148, 10),
    };
    expect(fitZoom(huge, paper)).toBe(3);
    const tiny = {
      width: areaFor(100, 0.01),
      height: areaFor(148, 0.01),
    };
    expect(fitZoom(tiny, paper)).toBe(0.1);
    const none = {
      width: 0,
      height: 0,
    };
    expect(fitZoom(none, paper)).toBe(0.1);
  });
});

describe("表示上の px から mm", () => {
  test("1mm あたりの px で割る", () => {
    expect(pxToMm(30, 4, false)).toBe(7.5);
    expect(pxToMm(-6, 4, false)).toBe(-1.5);
  });

  test("1mm 刻みのときは、整数の mm に丸める", () => {
    expect(pxToMm(29, 4, true)).toBe(7);
    expect(pxToMm(31, 4, true)).toBe(8);
    expect(pxToMm(-5, 4, true)).toBe(-1);
  });
});

describe("大きさを変えている途中の枠", () => {
  test("1mm 刻みでなければ、px をそのまま mm にする", () => {
    const box = {
      left: 10,
      top: 20,
      width: 30,
      height: 50,
    };
    expect(resizedRect(box, 4, false)).toEqual({
      left: 2.5,
      top: 5,
      width: 7.5,
      height: 12.5,
    });
  });

  test("1mm 刻みのときは、幅ではなく四辺をそれぞれ 1mm に合わせる", () => {
    // 左は 2.75mm から 3mm、右は 8mm のまま。幅は辺の差の 5mm。
    // 上は 1.25mm から 1mm、下は 4.5mm から 5mm。高さは 3.25mm を丸めた 3mm ではなく、辺の差の 4mm。
    const box = {
      left: 11,
      top: 5,
      width: 21,
      height: 13,
    };
    expect(resizedRect(box, 4, true)).toEqual({
      left: 3,
      top: 1,
      width: 5,
      height: 4,
    });
  });

  test("幅と高さは 1mm より小さくしない", () => {
    const box = {
      left: 8,
      top: 8,
      width: 1,
      height: 0,
    };
    expect(resizedRect(box, 4, true)).toMatchObject({
      width: 1,
      height: 1,
    });
    expect(resizedRect(box, 4, false)).toMatchObject({
      width: 1,
      height: 1,
    });
  });
});
