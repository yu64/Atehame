import { MainContent } from "@src/app/MainContent";
import { routes } from "@src/app/routes";
import { StepHeader } from "@src/app/StepHeader";
import { inputFields, type Template } from "@src/features/data";
import { Designer, layoutSummary, printLayout } from "@src/features/designer";
import { type LoadedCsv, loadedCsvAtom, usingTemplateAtom } from "@src/features/use/data";
import { type RowResult, useTransformRows } from "@src/features/use/preview/hooks/useTransformRows";
import { RowList } from "@src/features/use/preview/RowList";
import { errorMessage } from "@src/shared/lib/error";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: 定数

/** 行を見分けるために一覧に出すカラムの数。 */
const listedFieldCount = 3;

/** プレビューの領域の大きさ（px）。用紙はこの中に収まる大きさで表示する。 */
const previewSize = {
  width: 360,
  height: 480,
};

// #############################################################################
// MARK: コンポーネント

/** 確認と印刷。読み込んだ CSV の行に加工を実行し、プレビューして印刷する。 */
export function PreviewPage() {
  const template = useAtomValue(usingTemplateAtom);
  const csv = useAtomValue(loadedCsvAtom);

  return (
    <>
      <StepHeader
        title="確認と印刷"
        description="加工した結果を確かめ、印刷する行を選んで印刷します。"
        onBack={() => navigate(routes.use.load)}
      />
      <MainContent>
        <div className="flex flex-col gap-4 py-6">
          {(template && csv ? <RowsPreview template={template} csv={csv} /> : <NotLoaded />)}
        </div>
      </MainContent>
    </>
  );
}

// #############################################################################
// MARK: 内部部品

/** テンプレートか CSV がないとき（再読み込みした場合など）。 */
function NotLoaded() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-text-secondary">
        CSV が読み込まれていません。CSV の読み込みからやり直してください。
      </p>
      <Button
        icon="i-lucide-chevron-left"
        label="CSV の読み込みへ"
        size="md"
        onClick={() => navigate(routes.use.load)}
      />
    </div>
  );
}

/** 行の一覧・プレビュー・印刷。 */
function RowsPreview(props: { template: Template; csv: LoadedCsv }) {
  const { template, csv } = props;
  const { results, done } = useTransformRows(template, csv.rows);
  const [current, setCurrent] = useState(0);
  /** 印刷しない行（チェックを外した行）。エラーの行は、ここに入れなくても印刷しない。 */
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  const [printError, setPrintError] = useState<string>();

  const isFinished = done === csv.rows.length;
  const errorCount = results.filter(result => result.status === "error").length;
  const checkedValues = results.flatMap((result, index) => (
    (result.status === "success" && !excluded.has(index))
    ? [result.values]
    : []
  ),
  );
  const fields = inputFields(template.schema).slice(0, listedFieldCount);
  const paper = layoutSummary(template.layout).paper;

  /** 行の印刷するかを切り替える。 */
  function check(index: number, checked: boolean) {
    setExcluded(previous => {
      const next = new Set(previous);
      if (checked) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  /** チェックした行を、1行1ページで印刷する。 */
  async function print() {
    setPrintError(undefined);
    try {
      await printLayout(template.layout, checkedValues);
    } catch (error) {
      setPrintError(errorMessage(error));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 text-sm text-text-secondary">
          {(
            isFinished
            ? `${csv.rows.length} 行を加工しました（エラー ${errorCount} 行）。印刷する行: ${checkedValues.length} 行`
            : `加工しています… ${done} / ${csv.rows.length} 行`
          )}
        </p>
        <Button
          icon="i-lucide-printer"
          label="印刷"
          variant="primary"
          size="md"
          disabled={!isFinished || checkedValues.length === 0}
          onClick={() => void print()}
        />
      </div>
      {!isFinished && <progress className="progress w-full" value={done} max={csv.rows.length} />}
      {printError && <Alert kind="error" messages={[`印刷できませんでした: ${printError}`]} />}
      <Alert
        kind="info"
        messages={[
          `印刷のダイアログでは、用紙を ${paper.width}×${paper.height}mm に合わせ、倍率は「実際のサイズ（100%）」、余白は「なし」にしてください。`,
        ]}
      />

      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <RowList
            rows={csv.rows}
            results={results}
            fields={fields}
            isChecked={index => results[index]?.status === "success" && !excluded.has(index)}
            onCheck={check}
            current={current}
            onSelect={setCurrent}
          />
        </div>
        <RowDetail template={template} index={current} result={results[current]} />
      </div>
    </>
  );
}

/** プレビューしている行の、印刷のプレビューと、エラー・注意。 */
function RowDetail(props: { template: Template; index: number; result: RowResult | undefined }) {
  const { result } = props;
  return (
    <section className="flex shrink-0 flex-col gap-2" style={{ width: previewSize.width }}>
      <h2 className="text-sm font-bold">{props.index + 1} 行目</h2>
      {result?.status === "success" && (
        <>
          {/* デザイナーの用紙だけを、読み取り専用で置く。行を選び直したら値だけを差し替える。 */}
          <div className="overflow-hidden rounded-lg" style={{ height: previewSize.height }}>
            <Designer value={props.template.layout} sample={result.values}>
              <Designer.Canvas readOnly />
            </Designer>
          </div>
          {result.warnings.length > 0 && <Alert kind="warning" messages={result.warnings} />}
        </>
      )}
      {result?.status === "error" && <Alert kind="error" messages={[result.message]} />}
      {(!result || result.status === "pending") && (
        <p className="text-sm text-text-tertiary">加工しています…</p>
      )}
    </section>
  );
}
