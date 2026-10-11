import MainContent from "@src/app/MainContent";
import StepHeader from "@src/app/StepHeader";
import { layoutSummary } from "@src/features/designer";
import { exportStrategies } from "@src/features/save/export/strategies";
import {
  currentTemplateAtom,
  templateNameAtom,
  toFileName,
  toTemplateFile,
} from "@src/features/template";
import { formatBytes } from "@src/shared/lib/units";
import Alert from "@src/shared/ui/Alert";
import Button from "@src/shared/ui/Button";
import { Input } from "@src/shared/ui/Input";
import RadioCardGroup from "@src/shared/ui/RadioCardGroup";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { navigate } from "vike/client/router";

type SaveStatus =
  | { type: "idle" }
  | { type: "saving" }
  | { type: "saved"; label: string }
  | { type: "error"; message: string };

export default function Page() {
  const template = useAtomValue(currentTemplateAtom);
  const { schema, layout } = template;
  const code = template.transform.code;
  const [name, setName] = useAtom(templateNameAtom);
  const [strategyId, setStrategyId] = useState(exportStrategies[0].id);
  const [status, setStatus] = useState<SaveStatus>({ type: "idle" });
  const summary = useMemo(() => layoutSummary(layout), [layout]);

  const available = useMemo(
    () => exportStrategies.map(strategy => ({ strategy, available: strategy.isAvailable() })),
    [],
  );
  const selected =
    exportStrategies.find(strategy => strategy.id === strategyId) ?? exportStrategies[0];

  async function save() {
    setStatus({ type: "saving" });
    try {
      const file = toTemplateFile({ ...template, name: name.trim() });
      const done = await selected.export(file);
      setStatus(done ? { type: "saved", label: selected.label } : { type: "idle" });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : String(error) });
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
              description: available ? strategy.description : "このブラウザでは使えません。",
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
              {summary.imageCount === 0
                ? "なし"
                : `${summary.imageCount} 枚（${formatBytes(summary.imageBytes)}）`}
            </p>
          </section>

          <div className="flex items-center gap-4">
            <Button
              icon="i-lucide-download"
              label="保存"
              variant="primary"
              size="md"
              disabled={status.type === "saving"}
              onClick={save}
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
    </>
  );
}
