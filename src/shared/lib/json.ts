// #############################################################################
// MARK: 型定義

/** JSON で表せる値。ブラウザや実行環境に固有のオブジェクトは含めない。 */
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
