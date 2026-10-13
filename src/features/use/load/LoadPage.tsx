import { MainContent } from "@src/app/MainContent";
import { StepHeader } from "@src/app/StepHeader";
import { createCsvTemplate, csvTemplateFileName, type Template } from "@src/features/data";
import { type LoadedCsv, loadedCsvAtom, usingTemplateAtom } from "@src/features/use/data";
import { CsvSummary } from "@src/features/use/load/CsvSummary";
import { useCsvReader } from "@src/features/use/load/hooks/useCsvReader";
import { TemplateSummary } from "@src/features/use/load/TemplateSummary";
import { usePaste } from "@src/shared/hooks/usePaste";
import { downloadBlob } from "@src/shared/lib/download";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { FileDropZone } from "@src/shared/ui/FileDropZone";
import { useAtom, useAtomValue } from "jotai";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: コンポーネント

/** CSV の読み込み。テンプレートのカラムと見出しを対応させ、印刷する行を用意する。 */
export function LoadPage() {
  const template = useAtomValue(usingTemplateAtom);
  const [csv, setCsv] = useAtom(loadedCsvAtom);
  const isReady = csv !== undefined && csv.missing.length === 0 && csv.rows.length > 0;

  return (
    <>
      <StepHeader
        title="CSV の読み込み"
        description="印刷する内容の CSV を読み込みます。1行目は見出し（カラム名）にしてください。"
        onBack={() => navigate("/")}
        onNext={() => navigate("/use/preview")}
        nextDisabled={!isReady}
      />
      <MainContent width="contained">
        <div className="flex flex-col gap-6 py-6 max-w-2xl">
          {(template ? <CsvLoader template={template} csv={csv} onLoad={setCsv} /> : <NoTemplate />)}
        </div>
      </MainContent>
    </>
  );
}

// #############################################################################
// MARK: 内部部品

/** テンプレートを選んでいないとき（再読み込みした場合など）。 */
function NoTemplate() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-text-secondary">
        テンプレートが選ばれていません。トップに戻って選んでください。
      </p>
      <Button icon="i-lucide-house" label="トップへ戻る" size="md" onClick={() => navigate("/")} />
    </div>
  );
}

/** テンプレートの概要と、CSV のひな形・読み込み・結果。 */
function CsvLoader(props: {
  template: Template;
  csv: LoadedCsv | undefined;
  onLoad: (csv: LoadedCsv | undefined) => void;
}) {
  const { template } = props;
  const reader = useCsvReader(template, props.onLoad);

  // 画面のどこで貼り付けても受け付ける（Excel などからコピーした表や、コピーしたファイル）。
  usePaste(pasted => {
    if (pasted.kind === "file") void reader.readFile(pasted.file);
    else reader.readText(pasted.text, { kind: "paste" });
  });

  /** ひな形（見出しだけの CSV）をダウンロードする。 */
  function downloadTemplate() {
    const blob = new Blob([createCsvTemplate(template.schema)], { type: "text/csv" });
    downloadBlob(blob, csvTemplateFileName(template.name));
  }

  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="font-bold">テンプレート</h2>
        <TemplateSummary template={template} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">CSV</h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm text-text-secondary">
            見出しは、上のテンプレートのカラム名にそろえてください。
          </p>
          <Button
            icon="i-lucide-file-down"
            label="ひな形をダウンロード"
            onClick={downloadTemplate}
          />
        </div>
        <FileDropZone
          accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
          label="CSV のファイルを選ぶ"
          hint={
            <>
              Ctrl+V で、Excel などからコピーした表を貼り付けることもできます。
              <br />
              文字コードは UTF-8 か Shift_JIS（自動で判定します）
            </>
          }
          onFiles={([file]) => void reader.readFile(file)}
          onReject={reader.clearError}
        />
        {reader.error && (
          <Alert kind="error" messages={[`読み込めませんでした: ${reader.error}`]} />
        )}
        {props.csv && <CsvSummary template={template} csv={props.csv} />}
      </section>

      <p className="text-xs text-text-tertiary">
        読み込んだ CSV は、このブラウザの中だけで使います。どこにも送信せず、保存もしません。
      </p>
    </>
  );
}
