// #############################################################################
// MARK: 関数

/** 例外を、画面に出す文にする（Error ならその message、それ以外は文字列にしたもの）。 */
export function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error));
}
