// @vitest-environment happy-dom
import {
  assetDataUrl,
  assetLimits,
  checkAssetLimits,
  createAsset,
  type LayoutAsset,
  uniqueAssetName,
} from "@src/features/designer/assets/assets";
import { base64ToBytes } from "@src/shared/lib/imageFile";
import { describe, expect, test } from "vitest";

const png: LayoutAsset = { type: "image/png", data: "iVBORw0KGgo=" };
/** SVG のアセットの中身を文字列で取り出す。 */
function svgText(asset: LayoutAsset) {
  return new TextDecoder().decode(base64ToBytes(asset.data));
}

describe("画像（アセット）", () => {
  test("SVG は登録するときに安全化する", () => {
    const asset = createAsset(
      "image/svg+xml",
      new TextEncoder().encode(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>x</script><rect/></svg>',
      ),
    )!;
    expect(svgText(asset)).not.toContain("script");
    expect(svgText(asset)).toContain("<rect");
  });

  test("表示用の URL は、形式と中身を確かめてから組み立てる", () => {
    expect(assetDataUrl(png)).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(assetDataUrl({ type: "image/png", data: "not base64!" })).toBeUndefined();
    expect(assetDataUrl({ type: "text/html" as never, data: "PGI+" })).toBeUndefined();
  });

  test("保存された SVG も表示のときに安全化する（他人が作ったテンプレートに備える）", () => {
    const raw = btoa('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>');
    const url = assetDataUrl({ type: "image/svg+xml", data: raw })!;
    expect(atob(url.split(",")[1])).not.toContain("onload");
  });

  test("大きさの上限を超えると理由を返す", () => {
    const big: LayoutAsset = {
      type: "image/png",
      data: "A".repeat(((assetLimits.bytes + 3) / 3) * 4),
    };
    expect(checkAssetLimits({}, png)).toBeUndefined();
    expect(checkAssetLimits({}, big)).toContain("1枚");
    const half: LayoutAsset = {
      type: "image/png",
      data: "A".repeat(((assetLimits.bytes - 2) / 3) * 4),
    };
    expect(checkAssetLimits({ a: half, b: half, c: half }, half)).toContain("合計");
  });

  test("名前はファイル名から拡張子を除き、重ならないようにする", () => {
    expect(uniqueAssetName({}, "logo.png")).toBe("logo");
    expect(uniqueAssetName({ logo: png }, "logo.svg")).toBe("logo 2");
    expect(uniqueAssetName({}, ".png")).toBe("画像");
  });
});
