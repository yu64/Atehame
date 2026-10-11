import {
  encodeCssString,
  fieldPlaceholder,
  imageProperty,
  splitProperty,
  textProperty,
} from "@src/features/designer/layoutCss";
import { defaultFont, fontFamilyValue } from "@src/features/designer/render";
import type { ElementPreset } from "@src/features/designer/types";
import { formatMm } from "@src/shared/lib/units";

/** 文字を表示する部品。縦長の用紙では縦書きにする。 */
export const textPreset: ElementPreset = {
  id: "text",
  label: "テキスト",
  icon: "i-lucide-type",
  defaultName: "テキスト",
  create({ key, paper, count }) {
    const vertical = paper.height >= paper.width;
    const width = vertical ? 15 : Math.min(60, paper.width - 20);
    const height = vertical ? Math.min(80, paper.height - 20) : 12;
    const offset = (count % 5) * 5;

    return {
      declarations: [
        [textProperty, encodeCssString(key !== undefined ? fieldPlaceholder(key) : "テキスト")],
        ["left", formatMm((paper.width - width) / 2 + offset)],
        ["top", formatMm((paper.height - height) / 2 + offset)],
        ["width", formatMm(width)],
        ["height", formatMm(height)],
        ...(vertical ? ([["writing-mode", "vertical-rl"]] as Array<[string, string]>) : []),
        ["font-family", fontFamilyValue(defaultFont)],
        ["font-size", "14pt"],
      ],
    };
  },
};

/**
 * 郵便番号の枠。値を1文字ずつ分け、はがきの郵便番号枠の位置に並べる。
 * 位置は日本郵便の規格に基づく想定値のため、実際のはがきで確認すること。
 */
export const postalCodePreset: ElementPreset = {
  id: "postal-code",
  label: "郵便番号枠",
  icon: "i-lucide-mail",
  defaultName: "郵便番号",
  create({ key, fields }) {
    const postalKey =
      key ?? fields.find(field => /郵便|〒|zip|postal/i.test(field)) ?? fields[0] ?? "郵便番号";
    return {
      declarations: [
        [textProperty, encodeCssString(fieldPlaceholder(postalKey))],
        [splitProperty, "char"],
        ["left", "44mm"],
        ["top", "12mm"],
        ["width", "47.9mm"],
        ["height", "8mm"],
        ["flex-direction", "row"],
        ["align-items", "center"],
        ["font-family", fontFamilyValue(defaultFont)],
        ["font-size", "14pt"],
      ],
      // 枠の幅 5.7mm、上3桁の間隔 7mm、3桁目と4桁目 7.8mm、下4桁 6.8mm（枠の左端どうし）。
      nestedCss: [
        "/* 各桁。ハイフンなしの7桁を想定（加工で整形してください）。 */",
        '& > [data-part="char"] {',
        "  flex: none;",
        "  width: 5.7mm;",
        "  text-align: center;",
        "}",
        '& > [data-part="char"]:nth-child(n + 2) {',
        "  margin-inline-start: 1.3mm;",
        "}",
        '& > [data-part="char"]:nth-child(4) {',
        "  margin-inline-start: 2.1mm;",
        "}",
        '& > [data-part="char"]:nth-child(n + 5) {',
        "  margin-inline-start: 1.1mm;",
        "}",
      ].join("\n"),
    };
  },
};

/** 画像を表示する部品。登録済みの先頭の画像を、枠の中に全体が収まるように表示する。 */
export const imagePreset: ElementPreset = {
  id: "image",
  label: "画像",
  icon: "i-lucide-image",
  defaultName: "画像",
  requiresAsset: true,
  create({ assets, paper, count }) {
    const size = Math.min(30, paper.width / 2, paper.height / 2);
    const offset = (count % 5) * 5;
    return {
      declarations: [
        [imageProperty, encodeCssString(assets[0] ?? "")],
        ["left", formatMm((paper.width - size) / 2 + offset)],
        ["top", formatMm((paper.height - size) / 2 + offset)],
        ["width", formatMm(size)],
        ["height", formatMm(size)],
        ["object-fit", "contain"],
      ],
    };
  },
};

export const defaultPresets: ElementPreset[] = [textPreset, postalCodePreset, imagePreset];
