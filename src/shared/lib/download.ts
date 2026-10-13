// #############################################################################
// MARK: 関数

/** 中身をファイルとしてダウンロードさせる（ブラウザのダウンロード先に保存される）。 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  } finally {
    // クリック直後に破棄するとダウンロードが始まらないブラウザがあるため、少し待つ。
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
