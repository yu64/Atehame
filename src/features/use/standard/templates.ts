import { createLayout } from "@src/features/designer";
import type { Template } from "@src/features/template";

// #############################################################################
// MARK: 型定義

/** Atehame が用意するテンプレート。トップの「標準レイアウトを使う」から選ぶ。 */
export interface StandardTemplate {
  id: string;
  title: string;
  description: string;
  create: () => Template;
}

// #############################################################################
// MARK: 定数

/** はがきの宛名面（縦書き）。郵便番号は枠の位置に1桁ずつ、住所と宛名は縦書きで置く。 */
const hagakiAddress: StandardTemplate = {
  id: "hagaki-address",
  title: "はがきの宛名（縦書き）",
  description: "郵便番号・住所・氏名を、はがきの宛名面に縦書きで印刷します。",
  create: () => ({
    name: "はがきの宛名（縦書き）",
    schema: {
      version: 1,
      fields: [
        {
          id: "postal-code",
          name: "郵便番号",
          type: "string",
          memo: "ハイフンはあってもなくてもよい",
        },
        { id: "address", name: "住所", type: "string", memo: "" },
        { id: "name", name: "氏名", type: "string", memo: "" },
      ],
    },
    transform: {
      code: `// input: CSVの1行（カラム名 → 値）
// 郵便番号は枠に1桁ずつ入れるため、数字だけにする。
return {
  郵便番号: String(input.郵便番号 ?? "").replace(/[^0-9]/g, ""),
  住所: input.住所,
  氏名: input.氏名,
};
`,
    },
    layout: {
      version: 1,
      css: `${createLayout("hagaki").css}
[data-name="郵便番号"] {
  --atehame-text: "{郵便番号}";
  --atehame-split: char;
  left: 44mm;
  top: 12mm;
  width: 47.9mm;
  height: 8mm;
  flex-direction: row;
  align-items: center;
  font-family: var(--atehame-font-mincho);
  font-size: 14pt;

  /* 各桁。ハイフンなしの7桁を想定（加工で整形しています）。 */
  & > [data-part="char"] {
    flex: none;
    width: 5.7mm;
    text-align: center;
  }
  & > [data-part="char"]:nth-child(n + 2) {
    margin-inline-start: 1.3mm;
  }
  & > [data-part="char"]:nth-child(4) {
    margin-inline-start: 2.1mm;
  }
  & > [data-part="char"]:nth-child(n + 5) {
    margin-inline-start: 1.1mm;
  }
}

[data-name="住所"] {
  --atehame-text: "{住所}";
  left: 72mm;
  top: 26mm;
  width: 14mm;
  height: 100mm;
  writing-mode: vertical-rl;
  font-family: var(--atehame-font-mincho);
  font-size: 14pt;
  text-combine-upright: digits 2;
}

[data-name="宛名"] {
  --atehame-text: "{氏名} 様";
  left: 40mm;
  top: 30mm;
  width: 20mm;
  height: 105mm;
  writing-mode: vertical-rl;
  font-family: var(--atehame-font-mincho);
  font-size: 26pt;
  letter-spacing: 0.15em;
  justify-content: center;
}
`,
    },
  }),
};

export const standardTemplates: StandardTemplate[] = [hagakiAddress];
