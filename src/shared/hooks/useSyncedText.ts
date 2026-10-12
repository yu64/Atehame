import { useState } from "react";

// #############################################################################
// MARK: フック

/**
 * 入力欄に表示する文字。外から値が変わったとき（元に戻すなど）だけ表示を合わせ、入力途中の文字は保つ。
 *
 * 欄の文字と値は一致しないことがある（数値の欄の "12." と 12、前後の空白を除いた名前など）。
 * equals で「今の文字がその値と同じ意味か」を判定し、同じ意味なら上書きしない。
 * 外からの変化は描画中に前回の値と比べて検出する（effect で合わせると、古い文字で一度描画される）。
 */
export function useSyncedText(
  value: string,
  equals: (text: string) => boolean = text => text === value,
) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    if (!equals(text)) setText(value);
  }
  return [text, setText] as const;
}
