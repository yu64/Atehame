import { readTemplateText, type Template } from "@src/features/data";
import { TemplateSummary } from "@src/features/use/load";
import { fileReadErrorMessage } from "@src/shared/lib/error";
import { formatBytes } from "@src/shared/lib/units";
import { Alert } from "@src/shared/ui/Alert";
import { FileDropZone } from "@src/shared/ui/FileDropZone";
import { useState } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  /** 読み込めたテンプレート。読み込んでいなければ undefined。 */
  value?: Template;
  onChange: (template: Template | undefined) => void;
}

// #############################################################################
// MARK: 定数

/** 読み込むファイルの大きさの上限。画像を含めても、これより大きいテンプレートは作れない。 */
const maxFileBytes = 10 * 1024 * 1024;

// #############################################################################
// MARK: コンポーネント

/** テンプレートのファイルを選んで検証する。読めなければ理由を、読めれば概要を表示する。 */
export function TemplateFilePicker(props: Props) {
  const [error, setError] = useState<string>();
  const [fileName, setFileName] = useState<string>();

  /** ファイルを読み、テンプレートとして検証する。 */
  async function read(file: File) {
    setFileName(file.name);
    props.onChange(undefined);
    if (file.size > maxFileBytes) {
      setError(`ファイルが大きすぎます（${formatBytes(maxFileBytes)} まで）。`);
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError(fileReadErrorMessage);
      return;
    }
    const result = readTemplateText(text);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(undefined);
    props.onChange(result.template);
  }

  return (
    <div className="flex flex-col gap-3">
      <FileDropZone
        accept=".json,application/json"
        label="テンプレートのファイルを選ぶ"
        hint="保存したテンプレート（.atehame.json）"
        onFiles={([file]) => void read(file)}
        onReject={() => setError(undefined)}
      />
      {error && (
        <Alert kind="error" messages={[`「${fileName}」を読み込めませんでした: ${error}`]} />
      )}
      {props.value && <TemplateSummary template={props.value} />}
    </div>
  );
}
