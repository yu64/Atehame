import { fromTemplateFile, parseTemplateFile, type Template } from "@src/features/data/model";
import hagakiAddressUrl from "@src/features/data/standard/templates/hagaki-address.atehame.json?url";

// #############################################################################
// MARK: 型定義

/**
 * Atehame が用意するテンプレート。そのまま使うことも、編集して自分のテンプレートにすることもできる。
 * 中身はテンプレートのファイル（templates/*.atehame.json）で、選んだときに読み込む。
 */
export interface StandardTemplate {
  id: string;
  title: string;
  description: string;
  /** テンプレートのファイルの URL。 */
  url: string;
}

// #############################################################################
// MARK: 定数

/** 一覧に出す標準テンプレート。足すときは、アプリで作って保存したファイルを templates に置く。 */
export const standardTemplates: StandardTemplate[] = [
  {
    id: "hagaki-address",
    title: "はがきの宛名（縦書き）",
    description: "郵便番号・住所・氏名を、はがきの宛名面に縦書きで印刷します。",
    url: hagakiAddressUrl,
  },
];

// #############################################################################
// MARK: 関数

/**
 * 標準テンプレートの中身を読み込む。ユーザーがファイルを開くときと同じ確認を通す。
 * 読み込めなければ例外にする。
 */
export async function loadStandardTemplate(standard: StandardTemplate): Promise<Template> {
  const response = await fetch(standard.url);
  if (!response.ok) {
    throw new Error(`テンプレートを取得できませんでした（${response.status}）。`);
  }
  const result = parseTemplateFile(await response.text());
  if (!result.ok) throw new Error(result.message);
  return fromTemplateFile(result.file);
}
