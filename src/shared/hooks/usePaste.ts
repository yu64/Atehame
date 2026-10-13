import { isEditableTarget } from "@src/shared/lib/dom";
import { useEffect, useRef } from "react";

// #############################################################################
// MARK: 型定義

/** 貼り付けられたもの。ファイルがあればファイル、なければ文字。 */
export type Pasted = { kind: "file"; file: File } | { kind: "text"; text: string };

// #############################################################################
// MARK: フック

/**
 * 画面のどこで貼り付けても受け取る（コピーしたファイルや、表計算ソフトからコピーした表など）。
 * 入力欄での貼り付けは横取りしない。空の貼り付けは知らせない。
 */
export function usePaste(onPaste: (pasted: Pasted) => void): void {
  // 最新の onPaste を呼ぶ。描画のたびに登録し直さないよう、ref で持つ。
  const onPasteRef = useRef(onPaste);
  useEffect(() => {
    onPasteRef.current = onPaste;
  });

  useEffect(() => {
    /** 貼り付けを受け取り、ファイルか文字として知らせる。 */
    function listener(event: ClipboardEvent) {
      if (isEditableTarget(event.target)) return;
      const file = event.clipboardData?.files[0];
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (!file && text.trim() === "") return;
      event.preventDefault();
      onPasteRef.current(
        file
        ? {
          kind: "file",
          file,
        }
        : {
          kind: "text",
          text,
        }
      );
    }
    document.addEventListener("paste", listener);
    return () => document.removeEventListener("paste", listener);
  }, []);
}
