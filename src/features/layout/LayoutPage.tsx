import MainContent from "@src/app/MainContent";
import StepHeader from "@src/app/StepHeader";
import CodeEditor from "@src/app/ThemedCodeEditor";
import { Designer, type Values } from "@src/features/designer";
import { layoutAtom } from "@src/features/layout/store";
import { useSampleOutput } from "@src/features/transform";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { navigate } from "vike/client/router";

const emptyValues: Values = {};

export default function Page() {
  const [layout, setLayout] = useAtom(layoutAtom);
  const { preview } = useSampleOutput();

  // 加工の出力がオブジェクトの場合、そのキーを部品のパレットに、値をプレビューに使う。
  const sample = useMemo<Values | undefined>(() => {
    if (preview.status !== "success") return undefined;
    const output = preview.output;
    const isObject = typeof output === "object" && output !== null && !Array.isArray(output);
    return isObject ? (output as Values) : undefined;
  }, [preview]);
  const fields = useMemo(() => Object.keys(sample ?? {}), [sample]);

  return (
    <>
      <StepHeader
        title="レイアウト"
        description={
          <>
            加工で <code className="font-mono">return</code>{" "}
            した値を配置する、印刷用のレイアウトを作ります。
          </>
        }
        onBack={() => navigate("/edit/transform")}
        onNext={() => navigate("/edit/save")}
      />
      {preview.status === "error" && (
        <p
          role="status"
          className="shrink-0 w-full px-4 sm:px-6 lg:px-8 py-2 text-sm bg-status-warning-bg text-status-warning"
        >
          加工でエラーが発生しているため、出力の項目を表示できません。加工画面で確認してください。
        </p>
      )}
      <MainContent mode="canvas">
        <Designer
          value={layout}
          onChange={setLayout}
          fields={fields}
          sample={sample ?? emptyValues}
          cssEditor={CodeEditor}
        />
      </MainContent>
    </>
  );
}
