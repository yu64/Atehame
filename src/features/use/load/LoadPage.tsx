import { MainContent } from "@src/app/MainContent";
import { StepHeader } from "@src/app/StepHeader";
import {
  createCsvTemplate,
  csvTemplateFileName,
  readCsvTable,
  type Template,
} from "@src/features/data";
import {
  type CsvSource,
  type LoadedCsv,
  loadedCsvAtom,
  usingTemplateAtom,
} from "@src/features/use/data";
import { CsvSummary } from "@src/features/use/load/CsvSummary";
import { TemplateSummary } from "@src/features/use/load/TemplateSummary";
import { guessDelimiter, parseCsv } from "@src/shared/lib/csv";
import { downloadBlob } from "@src/shared/lib/download";
import { decodeText } from "@src/shared/lib/textFile";
import { formatBytes } from "@src/shared/lib/units";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { FileDropZone } from "@src/shared/ui/FileDropZone";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: 定数

/** 読み込む CSV の大きさの上限。はがきの宛名なら数万行でも収まる。 */
const maxCsvBytes = 10 * 1024 * 1024;

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
  const [error, setError] = useState<string>();

  /** ひな形（見出しだけの CSV）をダウンロードする。 */
  function downloadTemplate() {
    const blob = new Blob([createCsvTemplate(template.schema)], { type: "text/csv" });
    downloadBlob(blob, csvTemplateFileName(template.name));
  }

  /** 文字列を表として読み、見出しをテンプレートのカラムに対応させる。 */
  function load(text: string, source: CsvSource) {
    if (text.length > maxCsvBytes) {
      props.onLoad(undefined);
      setError(`大きすぎます（${formatBytes(maxCsvBytes)} まで）。`);
      return;
    }
    const table = readCsvTable(template.schema, parseCsv(text, guessDelimiter(text)));
    setError(undefined);
    props.onLoad({
      ...table,
      source,
    });
  }

  /** ファイルを読む。文字コードは自動で判定する。 */
  async function read(file: File) {
    if (file.size > maxCsvBytes) {
      props.onLoad(undefined);
      setError(`ファイルが大きすぎます（${formatBytes(maxCsvBytes)} まで）。`);
      return;
    }
    const { text, encoding } = decodeText(new Uint8Array(await file.arrayBuffer()));
    load(text, {
      kind: "file",
      fileName: file.name,
      encoding,
    });
  }

  // 画面のどこで貼り付けても受け付ける（Excel などからコピーした表や、コピーしたファイル）。
  // 入力欄での貼り付けは邪魔しない。read と load は描画のたびに作り直すため、毎回登録し直す。
  useEffect(() => {
    /** 貼り付けられたファイルか表を読み込む。 */
    function onPaste(event: ClipboardEvent) {
      if (isEditable(event.target)) return;
      const file = event.clipboardData?.files[0];
      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (!file && text.trim() === "") return;
      event.preventDefault();
      if (file) void read(file);
      else load(text, { kind: "paste" });
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

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
          onFiles={([file]) => void read(file)}
        />
        {error && <Alert kind="error" messages={[`読み込めませんでした: ${error}`]} />}
        {props.csv && <CsvSummary template={template} csv={props.csv} />}
      </section>

      <p className="text-xs text-text-tertiary">
        読み込んだ CSV は、このブラウザの中だけで使います。どこにも送信せず、保存もしません。
      </p>
    </>
  );
}

// #############################################################################
// MARK: 内部関数

/** 文字を入力する場所か（そこでの貼り付けは横取りしない）。 */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
