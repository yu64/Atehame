import NormalHeader from "@src/components/NormalHeader";
import PageFrame from "@src/components/PageFrame";



export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <PageFrame>
      <NormalHeader/>
      
      {children}
    </PageFrame>
  );
}
