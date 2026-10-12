import { LayoutDocument } from "@src/features/designer/layoutCss";
import {
  createLayout,
  type Layout,
  type PaperPreset,
  paperPresets,
} from "@src/features/designer/model";
import { postalCodePreset } from "@src/features/designer/presets";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderPages,
  type Values,
} from "@src/features/designer/render";
import { addFromPreset } from "@src/features/designer/state/operations";
import { scriptlessFrameSandbox } from "@src/shared/lib/frame/isolatedFrame";

/** はがき・封筒の宛名面のサンプル。部品はすべて CSS で書く。 */
function addressLayout(preset: PaperPreset): Layout {
  const { width, height } = paperPresets[preset];
  const base = LayoutDocument.from(createLayout(preset).css);
  const postal = addFromPreset(base, postalCodePreset, {
    fields: ["郵便番号"],
    assets: [],
    paper: {
      width,
      height,
    },
  }).layout.css.replace("left: 44mm;", `left: ${width - 56}mm;`);

  const css = `${postal}
[data-name="住所"] {
  --atehame-text: "{住所}";
  left: ${width - 30}mm; top: 25mm; width: 14mm; height: ${height * 0.6}mm;
  writing-mode: vertical-rl;
  font-size: 14pt;
  text-combine-upright: digits 2;
}

[data-name="宛名"] {
  --atehame-text: "{氏名} 様";
  left: ${width / 2 - 10}mm; top: 30mm; width: 20mm; height: ${height * 0.65}mm;
  writing-mode: vertical-rl;
  font-size: 26pt;
  font-weight: bold;
  letter-spacing: 0.15em;
  justify-content: center;
}

[data-name="差出人"] {
  --atehame-text: "東京都千代田区丸の内1丁目1番1号\\A 佐藤 花子";
  left: 6mm; top: ${height * 0.55}mm; width: 10mm; height: ${height * 0.4}mm;
  writing-mode: vertical-rl;
  font-size: 9pt;
  font-family: var(--atehame-font-gothic);
}
`;
  return {
    version: 1,
    css,
  };
}

const rows: Values[] = [
  {
    郵便番号: "1500043",
    住所: "東京都渋谷区道玄坂1丁目23番4号（サンプルビル）",
    氏名: "山田 太郎",
  },
  {
    郵便番号: "5300001",
    住所: "大阪府大阪市北区梅田3丁目1番1号",
    氏名: "鈴木 一郎",
  },
];

/**
 * 印刷と同じ手順（sandbox 付きの iframe）で文書を組み立て、HTML を返す。
 * extraCss はレイアウトの CSS の末尾に足す（確認用）。
 */
async function buildPrintHtml(preset: PaperPreset, extraCss = ""): Promise<string> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", scriptlessFrameSandbox);
  const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
  frame.srcdoc = createDocumentHtml();
  document.body.append(frame);
  await loaded;

  const doc = frame.contentDocument!;
  const base = addressLayout(preset);
  const layout = LayoutDocument.from(`${base.css}\n${extraCss}`);
  applyLayoutStyles(doc, layout);
  renderPages(doc, layout, rows);
  const html = "<!doctype html>" + doc.documentElement.outerHTML;
  frame.remove();
  return html;
}

Object.assign(window, {
  buildPrintHtml,
  rowCount: rows.length,
});
