import { pxPerMm } from "@src/shared/lib/units";

// #############################################################################
// MARK: 型定義

/** キー操作で行う操作。nudge の dx・dy は mm。 */
export type KeyCommand =
  | { type: "undo" }
  | { type: "redo" }
  | { type: "duplicate" }
  | { type: "remove" }
  | { type: "deselect" }
  | {
      type: "nudge";
      dx: number;
      dy: number;
    };

/** キーの入力のうち、操作を決めるのに使うもの（KeyboardEvent の一部）。 */
export interface KeyInput {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

// #############################################################################
// MARK: 定数

/** 矢印キーで 1px、Shift と矢印キーで 1mm 動かす。 */
const pxInMm = 1 / pxPerMm;

// #############################################################################
// MARK: 関数

/**
 * キーの入力を、デザイナーの操作にする。割り当てのないキーは undefined。
 * Ctrl は、Mac の Command（metaKey）でも同じに扱う。
 */
export function keyCommand(input: KeyInput): KeyCommand | undefined {
  const mod = input.ctrlKey || input.metaKey;
  const key = input.key.toLowerCase();

  if (mod && key === "z" && !input.shiftKey) return { type: "undo" };
  if (mod && (key === "y" || (key === "z" && input.shiftKey))) return { type: "redo" };
  if (mod && key === "d") return { type: "duplicate" };
  if (key === "delete" || key === "backspace") return { type: "remove" };
  if (key === "escape") return { type: "deselect" };
  if (key.startsWith("arrow")) {
    const step = (input.shiftKey ? 1 : pxInMm);
    return {
      type: "nudge",
      dx: (key === "arrowleft" ? -step : (key === "arrowright" ? step : 0)),
      dy: (key === "arrowup" ? -step : (key === "arrowdown" ? step : 0)),
    };
  }
  return undefined;
}
