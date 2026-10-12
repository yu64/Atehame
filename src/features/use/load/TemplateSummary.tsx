import { type Template } from "@src/features/data";
import { layoutSummary } from "@src/features/designer";

// #############################################################################
// MARK: コンポーネント

/** テンプレートの概要。 */
export function TemplateSummary(props: { template: Template }) {
  const { template } = props;
  const layout = layoutSummary(template.layout);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm rounded-lg bg-base p-3">
      <dt className="text-text-secondary">名前</dt>
      <dd className="text-text-primary font-bold">{template.name || "（名前なし）"}</dd>
      <dt className="text-text-secondary">カラム</dt>
      <dd>{template.schema.fields.map(field => field.name).join("、") || "なし"}</dd>
      <dt className="text-text-secondary">レイアウト</dt>
      <dd>
        {layout.elementCount} 部品（{layout.paper.width}×{layout.paper.height}mm）
        {layout.imageCount > 0 && `・画像 ${layout.imageCount} 枚`}
      </dd>
    </dl>
  );
}
