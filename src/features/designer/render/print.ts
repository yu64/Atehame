import type { LayoutDocument } from "@src/features/designer/layoutCss";
import { type Layout, toLayoutDocument } from "@src/features/designer/model";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderPages,
} from "@src/features/designer/render/document";
import type { Values } from "@src/features/designer/render/elements";
import { scriptlessFrameSandbox } from "@src/shared/lib/frame/isolatedFrame";
import { printInHiddenFrame } from "@src/shared/lib/frame/printFrame";

// #############################################################################
// MARK: 関数

/** 行ごとに1ページずつ組み立てて印刷する（デザイナーの内部用。外には printLayout を公開する）。 */
export function printPages(layout: LayoutDocument, rows: Values[]): Promise<void> {
  return printInHiddenFrame({
    html: createDocumentHtml(),
    sandbox: scriptlessFrameSandbox,
    prepare: doc => {
      applyLayoutStyles(doc, layout);
      renderPages(doc, layout, rows);
    },
  });
}

/** レイアウトを使い、行ごとに1ページずつ組み立てて印刷する。 */
export function printLayout(layout: Layout, rows: Values[]): Promise<void> {
  return printPages(toLayoutDocument(layout), rows);
}
