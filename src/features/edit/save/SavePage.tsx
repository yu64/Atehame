import { MainContent } from "@src/app/MainContent";
import { StepHeader } from "@src/app/StepHeader";
import { templateWarnings, toFileName, toTemplateFile } from "@src/features/data";
import { layoutSummary } from "@src/features/designer";
import { currentTemplateAtom, templateNameAtom } from "@src/features/edit/data";
import { exportStrategies } from "@src/features/edit/save/export/strategies";
import { useSampleOutput } from "@src/features/edit/transform";
import { errorMessage } from "@src/shared/lib/error";
import { formatBytes } from "@src/shared/lib/units";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { ConfirmDialog } from "@src/shared/ui/ConfirmDialog";
import { Input } from "@src/shared/ui/Input";
import { RadioCardGroup } from "@src/shared/ui/RadioCardGroup";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: 型定義

type SaveStatus =
  | { type: "idle" }
  | { type: "saving" }
  | { type: "saved"; label: string }
  | { type: "error"; message: string };

// #############################################################################
// MARK: コンポーネント

/** 保存の工程。名前と保存の方法を選び、テンプレートのファイルとして書き出す。 */
export function SavePage() {
  const template = useAtomValue(currentTemplateAtom);
  const { schema, layout } = template;
  const code = template.transform.code;
  const [name, setName] = useAtom(templateNameAtom);
  const [strategyId, setStrategyId] = useState(exportStrategies[0].id);
  const [status, setStatus] = useState<SaveStatus>({ type: "idle" });
  const summary = useMemo(() => layoutSummary(layout), [layout]);
  const [confirming, setConfirming] = useState<string[]>();
  const { preview } = useSampleOutput();

  const available = useMemo(
    () =>
      exportStrategies.map(strategy => ({
        strategy,
        available: strategy.isAvailable(),
      })),
    [],
  );
  const selected = (
    exportStrategies.find(strategy => strategy.id === strategyId) ?? exportStrategies[0]
  );

  /** 保存する前に問題を確かめる。問題があれば、一覧を見せてから保存するか選んでもらう。 */
  function requestSave() {
    const warnings = templateWarnings(template);
    if (preview.status === "error") {
      warnings.push(`加工: サンプル行で実行するとエラーになります（${preview.message}）。`);
    }
    if (warnings.length === 0) void save();
    else setConfirming(warnings);
  }

  /** 選んだ方法でテンプレートを書き出し、結果を表示する。 */
  async function save() {
    setConfirming(undefined);
    setStatus({ type: "saving" });
    try {
      const file = toTemplateFile({
        ...template,
        name: name.trim(),
      });
      const done = await selected.export(file);
      setStatus(
        done
        ? {
          type: "saved",
          label: selected.label,
        }
        : { type: "idle" }
      );
    } catch (error) {
      setStatus({
        type: "error",
        message: errorMessage(error),
      });
    }
  }

  return (
    <>
      <StepHeader
        title="保存"
        description="スキーマ・加工・レイアウトをテンプレートとして保存します。"
        onBack={() => navigate("/edit/layout")}
      />
      <MainContent width="contained">
        <div className="flex flex-col gap-6 py-6 max-w-2xl">
          <Input
            type="text"
            label="テンプレートの名前"
            description={`ファイル名: ${toFileName(name)}`}
            placeholder="例: 年賀状の宛名"
            value={name}
            onChange={event => setName(event.currentTarget.value)}
          />

          <RadioCardGroup
            name="strategy"
            legend="保存の方法"
            options={available.map(({ strategy, available }) => ({
              value: strategy.id,
              label: strategy.label,
              description: (available ? strategy.description : "このブラウザでは使えません。"),
              disabled: !available,
            }))}
            value={strategyId}
            onChange={setStrategyId}
          />

          <section className="flex flex-col gap-1 text-sm text-text-secondary">
            <h2 className="font-bold text-text-primary">保存する内容</h2>
            <p>スキーマ: {schema.fields.length} カラム</p>
            <p>加工: {code.split("\n").length} 行</p>
            <p>
              レイアウト: {summary.elementCount} 部品（{summary.paper.width}×{summary.paper.height}
              mm）
            </p>
            <p>
              画像:{" "}
              {(
                (summary.imageCount === 0)
                ? "なし"
                : `${summary.imageCount} 枚（${formatBytes(summary.imageBytes)}）`
              )}
            </p>
          </section>

          <div className="flex items-center gap-4">
            <Button
              icon="i-lucide-download"
              label="保存"
              variant="primary"
              size="md"
              disabled={status.type === "saving"}
              onClick={requestSave}
            />
            {/* 作業中の内容は残るので、トップの「続きから編集」で戻れる。 */}
            <Button
              icon="i-lucide-house"
              label="トップへ戻る"
              size="md"
              onClick={() => navigate("/")}
            />
          </div>
          {status.type === "saved" && (
            <Alert kind="success" messages={[`保存しました（${status.label}）。`]} />
          )}
          {status.type === "error" && (
            <Alert kind="error" messages={[`保存できませんでした: ${status.message}`]} />
          )}
        </div>
      </MainContent>
      <ConfirmDialog
        open={confirming !== undefined}
        title="このまま保存しますか？"
        message={
          <>
            <p>次の点が気になります。保存はできますが、使うときに困るかもしれません。</p>
            <ul className="mt-2 list-disc pl-5">
              {confirming?.map(warning => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </>
        }
        confirmLabel="このまま保存"
        cancelLabel="戻って直す"
        onConfirm={() => void save()}
        onCancel={() => setConfirming(undefined)}
      />
    </>
  );
}
