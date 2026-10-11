import type { LayoutDocument } from "@src/features/designer/layoutCss";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderFrameSandbox,
  renderPages,
} from "@src/features/designer/render/document";
import type { Values } from "@src/features/designer/render/elements";

/**
 * 行ごとのページを、画面に表示しない iframe に組み立てて印刷する。
 * 印刷ダイアログを閉じるまで待ち、iframe を片付ける。
 */
export async function printPages(layout: LayoutDocument, rows: Values[]): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", renderFrameSandbox);
  frame.setAttribute("aria-hidden", "true");
  // display: none にすると印刷内容が空になるブラウザがあるため、大きさを 0 にして隠す。
  Object.assign(frame.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });

  const loaded = new Promise<void>(resolve =>
    frame.addEventListener("load", () => resolve(), { once: true }),
  );
  frame.srcdoc = createDocumentHtml();
  document.body.append(frame);

  try {
    await loaded;
    const doc = frame.contentDocument;
    const view = frame.contentWindow;
    if (!doc || !view) throw new Error("印刷用の文書を作成できませんでした。");

    applyLayoutStyles(doc, layout);
    renderPages(doc, layout, rows);
    await doc.fonts.ready;

    const printed = new Promise<void>(resolve => {
      view.addEventListener("afterprint", () => resolve(), { once: true });
      // afterprint が届かないブラウザに備え、一定時間で片付ける。
      setTimeout(resolve, 60_000);
    });
    view.focus();
    view.print();
    await printed;
  } finally {
    frame.remove();
  }
}
