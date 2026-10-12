import { layoutSummary } from "@src/features/designer";
import { fromTemplateFile, parseTemplateFile, type Template } from "@src/features/template/model";
import { formatBytes } from "@src/shared/lib/units";
import { Alert } from "@src/shared/ui/Alert";
import { FileDropZone } from "@src/shared/ui/FileDropZone";
import { useState } from "react";

/** 読み込むファイルの大きさの上限。画像を含めても、これより大きいテンプレートは作れない。 */
const maxFileBytes = 10 * 1024 * 1024;

export interface Props {
  /** 読み込めたテンプレート。読み込んでいなければ undefined。 */
  value?: Template;
  onChange: (template: Template | undefined) => void;
}

/** テンプレートのファイルを選んで検証する。読めなければ理由を、読めれば概要を表示する。 */
export function TemplateFilePicker(props: Props) {
  const [error, setError] = useState<string>();
  const [fileName, setFileName] = useState<string>();

  async function read(file: File) {
    setFileName(file.name);
    props.onChange(undefined);
    if (file.size > maxFileBytes) {
      setError(`ファイルが大きすぎます（${formatBytes(maxFileBytes)} まで）。`);
      return;
    }
    const result = parseTemplateFile(await file.text());
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    props.onChange(fromTemplateFile(result.file));
  }

  return (
    <div className="flex flex-col gap-3">
      <FileDropZone
        accept=".json,application/json"
        label="テンプレートのファイルを選ぶ"
        hint="保存したテンプレート（.atehame.json）"
        onFiles={([file]) => void read(file)}
      />
      {error && (
        <Alert kind="error" messages={[`「${fileName}」を読み込めませんでした: ${error}`]} />
      )}
      {props.value && <TemplateSummary template={props.value} />}
    </div>
  );
}

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
