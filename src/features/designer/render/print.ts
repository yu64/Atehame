import type { LayoutDocument } from "@src/features/designer/layoutCss";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderPages,
} from "@src/features/designer/render/document";
import type { Values } from "@src/features/designer/render/elements";
import { scriptlessFrameSandbox } from "@src/shared/lib/frame/isolatedFrame";
import { printInHiddenFrame } from "@src/shared/lib/frame/printFrame";

/** 行ごとに1ページずつ組み立てて印刷する。 */
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
