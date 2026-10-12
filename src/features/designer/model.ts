import {
  assetBytes,
  assetLimits,
  type Assets,
  isValidAsset,
  totalAssetBytes,
} from "@src/features/designer/assets/assets";
import { LayoutDocument, type PageSize } from "@src/features/designer/layoutCss";
import { imageTypes } from "@src/shared/lib/imageFile";
import { keysOf } from "@src/shared/lib/util/object";
import { z } from "zod";

// #############################################################################
// MARK: レイアウト

/**
 * レイアウト。部品も用紙も CSS で表す（約束事は layoutCss/parse.ts）。
 * CSS は作成者が書いたまま保存し、表示や印刷のたびに安全化する。
 */
export interface Layout {
  version: 1;
  css: string;
  /** 画像。名前ごとに持ち、部品は `--atehame-image: "名前";` で参照する。なければ省く。 */
  assets?: Assets;
}

/** 用紙だけを指定した、空のレイアウト。 */
export function createLayout(preset: PaperPreset = "hagaki"): Layout {
  const { width, height } = paperPresets[preset];
  return {
    version: 1,
    css: `@page {\n  size: ${width}mm ${height}mm;\n}\n`,
  };
}

/** レイアウトの CSS を扱う文書にする。 */
export function toLayoutDocument(layout: Layout): LayoutDocument {
  return LayoutDocument.from(layout.css, layout.assets);
}

/** 文書を保存用のレイアウトにする。 */
export function fromLayoutDocument(layoutDocument: LayoutDocument): Layout {
  const { css, assets } = layoutDocument;
  return (
    (Object.keys(assets).length === 0)
    ? {
      version: 1,
      css,
    }
    : {
      version: 1,
      css,
      assets,
    }
  );
}

// #############################################################################
// MARK: 用紙

export type PaperPreset = "hagaki" | "nagagata3" | "nagagata4" | "kakugata2" | "a4";

/** 用紙の種類。寸法は mm。 */
export const paperPresets: Record<PaperPreset, PageSize & { label: string }> = {
  hagaki: {
    label: "はがき",
    width: 100,
    height: 148,
  },
  nagagata3: {
    label: "長形3号",
    width: 120,
    height: 235,
  },
  nagagata4: {
    label: "長形4号",
    width: 90,
    height: 205,
  },
  kakugata2: {
    label: "角形2号",
    width: 240,
    height: 332,
  },
  a4: {
    label: "A4",
    width: 210,
    height: 297,
  },
};

/** @page で用紙サイズを指定していない場合の用紙。 */
export const defaultPaper = paperPresets.hagaki;

/** 用紙の大きさ（mm）。@page で指定していなければ既定の用紙。 */
export function paperSizeOf(layoutDocument: LayoutDocument): PageSize {
  return (
    layoutDocument.pageSize ?? {
      width: defaultPaper.width,
      height: defaultPaper.height,
    }
  );
}

/** 用紙の大きさに一致する種類。なければ undefined（任意のサイズ）。 */
export function paperPresetOf(size: PageSize): PaperPreset | undefined {
  return keysOf(paperPresets).find(
    preset => (
      Math.abs(paperPresets[preset].width - size.width) < 0.01
      && Math.abs(paperPresets[preset].height - size.height) < 0.01
    ),
  );
}

// #############################################################################
// MARK: 概要

export interface LayoutSummary {
  paper: PageSize;
  elementCount: number;
  imageCount: number;
  /** 画像の合計の大きさ（バイト）。 */
  imageBytes: number;
}

/** レイアウトの概要。CSS の中身を知らない側（保存画面など）に見せる。 */
export function layoutSummary(layout: Layout): LayoutSummary {
  const layoutDocument = toLayoutDocument(layout);
  return {
    paper: paperSizeOf(layoutDocument),
    elementCount: layoutDocument.elements.length,
    imageCount: Object.keys(layoutDocument.assets).length,
    imageBytes: totalAssetBytes(layoutDocument.assets),
  };
}

// #############################################################################
// MARK: 検証

export const maxLayoutCssLength = 100_000;

const assetSchema = z
  .object({
    type: z.enum(imageTypes),
    data: z.string(),
  })
  .refine(isValidAsset, "画像の形式が正しくありません。")
  .refine(asset => assetBytes(asset) <= assetLimits.bytes, "画像が大きすぎます。");

/** 保存したレイアウトの検証（テンプレートのファイルや自動保存を読み込むとき）。 */
export const layoutSchema = z.object({
  version: z.literal(1),
  css: z.string().max(maxLayoutCssLength),
  assets: z
    .record(z.string().min(1).max(assetLimits.nameLength), assetSchema)
    .refine(
      assets => totalAssetBytes(assets) <= assetLimits.totalBytes,
      "画像の合計が大きすぎます。",
    )
    .optional(),
});
