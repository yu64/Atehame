import MainContent from "@src/components/MainContent";
import StepHeader from "@src/components/StepHeader";
import { navigate } from "vike/client/router";

export default function Page() {
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
      />
      <MainContent>
        <p className="pt-4 text-sm text-text-secondary">レイアウトの編集機能は準備中です。</p>
      </MainContent>
    </>
  );
}
