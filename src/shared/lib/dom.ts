// #############################################################################
// MARK: 関数

/** 文字を入力する場所か（入力欄・選択欄・編集できる要素）。そこでのキー操作や貼り付けは横取りしない。 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
