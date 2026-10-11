export interface PrintFrameOptions {
  /** iframe の srcdoc。 */
  html: string;
  /** iframe の sandbox 属性。印刷には allow-modals が必要。 */
  sandbox: string;
  /** 読み込み後、印刷の前に中身を組み立てる。 */
  prepare: (doc: Document) => void | Promise<void>;
  /** afterprint が届かないブラウザに備えて片付けるまでの時間（ms）。 */
  timeoutMs?: number;
}

/**
 * 画面に表示しない iframe に文書を組み立てて印刷する。
 * フォントの読み込みを待ってから印刷し、印刷ダイアログを閉じたら iframe を片付ける。
 */
export async function printInHiddenFrame(options: PrintFrameOptions): Promise<void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", options.sandbox);
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
  frame.srcdoc = options.html;
  document.body.append(frame);

  try {
    await loaded;
    const doc = frame.contentDocument;
    const view = frame.contentWindow;
    if (!doc || !view) throw new Error("印刷用の文書を作成できませんでした。");

    await options.prepare(doc);
    await doc.fonts.ready;

    const printed = new Promise<void>(resolve => {
      view.addEventListener("afterprint", () => resolve(), { once: true });
      setTimeout(resolve, options.timeoutMs ?? 60_000);
    });
    view.focus();
    view.print();
    await printed;
  } finally {
    frame.remove();
  }
}
