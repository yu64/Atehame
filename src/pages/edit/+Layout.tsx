import NormalHeader from "@src/app/NormalHeader";
import PageFrame from "@src/app/PageFrame";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PageFrame>
      <NormalHeader />

      {children}
    </PageFrame>
  );
}
