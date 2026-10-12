// #############################################################################
// MARK: 型定義

export interface IsolatedFrameOptions {
  lang?: string;
  /**
   * head に置く style 要素。css はアプリが用意したものだけを渡す（利用者の入力は setStyleText で後から入れる）。
   * css を省くと空の style 要素になり、後から setStyleText で中身を入れられる。
   */
  styles?: Array<{ id: string; css?: string }>;
}

// #############################################################################
// MARK: 定数

/**
 * 外部と切り離した iframe の文書。中身は親が DOM で組み立てる前提で、iframe の中ではスクリプトを動かさない。
 */

/**
 * スクリプトを実行させない sandbox。親から中身を組み立てられるよう同一オリジンとし、
 * 印刷のためにダイアログを許可する。
 */
export const scriptlessFrameSandbox = "allow-same-origin allow-modals";

/** 外部への通信を一切許可しない CSP。インラインのスタイルと data: の画像・フォントだけを使える。 */
export const isolatedFrameCsp =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:";

// #############################################################################
// MARK: 関数

/** iframe の srcdoc に使う HTML。CSP を meta で指定し、本文は空にする。 */
export function createIsolatedFrameHtml(options: IsolatedFrameOptions = {}): string {
  const styles = (options.styles ?? []).map(
    style => `<style id="${style.id}">${style.css ?? ""}</style>`,
  );
  return [
    "<!doctype html>",
    `<html lang="${options.lang ?? "ja"}"><head><meta charset="utf-8">`,
    `<meta http-equiv="Content-Security-Policy" content="${isolatedFrameCsp}">`,
    ...styles,
    "</head><body></body></html>",
  ].join("");
}

/** style 要素の中身を設定する。CSS は文字列として入れ、HTML としては解釈させない。 */
export function setStyleText(doc: Document, id: string, css: string): void {
  let style = doc.getElementById(id);
  if (!style) {
    style = doc.createElement("style");
    style.id = id;
    doc.head.append(style);
  }
  if (style.textContent !== css) style.textContent = css;
}
