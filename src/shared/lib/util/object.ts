// #############################################################################
// MARK: 関数

/**
 * オブジェクトのキーを、キーの型のまま返す（Object.keys は string[] を返すため）。
 * 決まったキーだけを持つオブジェクト（選択肢の表など）に使う。
 */
export function keysOf<T extends object>(value: T): Array<keyof T & string> {
  return Object.keys(value) as Array<keyof T & string>;
}
