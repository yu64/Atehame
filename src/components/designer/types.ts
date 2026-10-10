import type { PageSize } from "@src/logic/layoutCss";
import type { ComponentType } from "react";

export interface PresetContext {
  /** 新しい部品の名前（重複しないよう決め済み）。 */
  name: string;
  /** パレットで値の名前から追加した場合、その名前。 */
  key?: string;
  /** 値の名前の一覧（加工の出力のキー）。 */
  fields: string[];
  /** 用紙の大きさ（mm）。 */
  paper: PageSize;
  /** すでにある部品の数。追加位置をずらすのに使う。 */
  count: number;
}

export interface PresetResult {
  /** 部品の規則（[data-name="名前"]）に書く宣言。 */
  declarations: Array<[property: string, value: string]>;
  /** 部品の規則の中に入れ子で書く CSS（& > [data-part="char"] など、中身の調整）。 */
  nestedCss?: string;
}

/**
 * パレットから追加する部品の雛形。部品そのものは CSS の規則なので、
 * 雛形は「どんな CSS を書き足すか」だけを決める。
 */
export interface ElementPreset {
  id: string;
  label: string;
  /** lucide のアイコンのクラス名。 */
  icon: string;
  /** 値の名前を指定しない場合の部品の名前。 */
  defaultName: string;
  create(context: PresetContext): PresetResult;
}

/** CSS の編集欄で、指定した行へ移動する要求。key を変えるたびに移動する。 */
export interface RevealRequest {
  line: number;
  key: number;
}

/** CSS の編集欄として差し込めるエディター。CodeEditor と同じ形。 */
export type CssEditorComponent = ComponentType<{
  value: string;
  onChange: (value: string) => void;
  language?: "css";
  ariaLabel?: string;
  reveal?: RevealRequest;
}>;
