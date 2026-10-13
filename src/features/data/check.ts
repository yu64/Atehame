import { type Template, toFileName } from "@src/features/data/model";
import { classifyFields } from "@src/features/data/schema";
import { layoutWarnings } from "@src/features/designer";

// #############################################################################
// MARK: 関数

/**
 * 保存の前に知らせる問題（保存はできるが、使うときに困るもの）。
 * 加工のコードの実行結果は、実行エンジンが要るため含めない（保存画面で合わせる）。
 */
export function templateWarnings(template: Template): string[] {
  const warnings: string[] = [];

  if (template.name.trim() === "") {
    warnings.push(`テンプレートの名前がありません（ファイル名は ${toFileName("")} になります）。`);
  }

  const fields = classifyFields(template.schema);
  if (fields.length === 0) warnings.push("スキーマにカラムがありません。");
  if (fields.some(field => field.role === "unnamed")) {
    warnings.push("スキーマに名前のないカラムがあります（加工の input に含まれません）。");
  }
  const duplicated = new Set(
    fields.filter(field => field.role === "duplicate").map(field => field.name),
  );
  for (const name of duplicated) warnings.push(`スキーマのカラム名「${name}」が重複しています。`);

  for (const warning of layoutWarnings(template.layout)) warnings.push(`レイアウト: ${warning}`);
  return warnings;
}
