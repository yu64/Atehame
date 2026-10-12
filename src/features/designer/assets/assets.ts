import {
  base64ByteLength,
  base64ToBytes,
  bytesToBase64,
  type ImageType,
  imageTypes,
  isBase64,
} from "@src/shared/lib/imageFile";
import { sanitizeSvg } from "@src/shared/lib/sanitizeSvg";
import { formatBytes } from "@src/shared/lib/units";

// #############################################################################
// MARK: アセット

/**
 * レイアウトの画像（アセット）。CSS には書かず、レイアウトと一緒に名前ごとに持つ。
 * 部品は `--atehame-image: "名前";` で参照する。
 */
export interface LayoutAsset {
  type: ImageType;
  /** 画像の中身（base64）。 */
  data: string;
}

export type Assets = Readonly<Record<string, LayoutAsset>>;

export const emptyAssets: Assets = Object.freeze({});

/** 大きさの上限（バイト）。テンプレートのファイルに入るため、大きすぎないようにする。 */
export const assetLimits = {
  bytes: 1024 * 1024,
  totalBytes: 3 * 1024 * 1024,
  nameLength: 100,
};

/** アセット1つの大きさ（バイト）。 */
export function assetBytes(asset: LayoutAsset): number {
  return base64ByteLength(asset.data);
}

/** アセットの合計の大きさ（バイト）。 */
export function totalAssetBytes(assets: Assets): number {
  return Object.values(assets).reduce((sum, asset) => sum + assetBytes(asset), 0);
}

// #############################################################################
// MARK: 作成と確認

/** 保存されたアセットとして正しいか（形式と中身の文字だけを見る）。 */
export function isValidAsset(asset: LayoutAsset): boolean {
  return imageTypes.includes(asset.type) && isBase64(asset.data);
}

/** 画像のファイルの中身から、アセットを作る。SVG は安全化してから持つ。 */
export function createAsset(type: ImageType, bytes: Uint8Array): LayoutAsset | undefined {
  if (type !== "image/svg+xml") return { type, data: bytesToBase64(bytes) };
  const svg = sanitizeSvg(new TextDecoder().decode(bytes));
  return (
    svg === undefined
    ? undefined
    : { type, data: bytesToBase64(new TextEncoder().encode(svg)) }
  );
}

/** 追加できるか。できなければ理由を返す。 */
export function checkAssetLimits(assets: Assets, asset: LayoutAsset): string | undefined {
  if (assetBytes(asset) > assetLimits.bytes) {
    return `画像が大きすぎます（1枚 ${formatBytes(assetLimits.bytes)} まで）。`;
  }
  if (totalAssetBytes(assets) + assetBytes(asset) > assetLimits.totalBytes) {
    return `画像の合計が大きすぎます（合計 ${formatBytes(assetLimits.totalBytes)} まで）。`;
  }
  return undefined;
}

/** 既存と重ならないアセットの名前。ファイル名から拡張子を除いたものを元にする。 */
export function uniqueAssetName(assets: Assets, fileName: string): string {
  const base =
    fileName
      .replace(/\.[^.]*$/, "")
      .trim()
      .slice(0, assetLimits.nameLength) || "画像";
  if (!(base in assets)) return base;
  for (let index = 2; ; index++) {
    const name = `${base} ${index}`;
    if (!(name in assets)) return name;
  }
}

// #############################################################################
// MARK: 表示

const dataUrls = new WeakMap<LayoutAsset, string>();

/**
 * 表示に使う data: URL。形式と中身を確かめてから組み立て、正しくなければ undefined。
 * 他人が作ったテンプレートも読み込むため、SVG は表示のたびにも安全化する（結果は覚えておく）。
 */
export function assetDataUrl(asset: LayoutAsset): string | undefined {
  const cached = dataUrls.get(asset);
  if (cached !== undefined) return cached;
  if (!isValidAsset(asset)) return undefined;

  let data = asset.data;
  if (asset.type === "image/svg+xml") {
    const svg = sanitizeSvg(new TextDecoder().decode(base64ToBytes(asset.data)));
    if (svg === undefined) return undefined;
    data = bytesToBase64(new TextEncoder().encode(svg));
  }
  const url = `data:${asset.type};base64,${data}`;
  dataUrls.set(asset, url);
  return url;
}
