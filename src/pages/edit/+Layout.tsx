import Logo from "@src/components/Logo";
import MainContent from "@src/components/MainContent";
import NormalHeader from "@src/components/NormalHeader";
import PageFrame from "@src/components/PageFrame";



export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <PageFrame>
      <NormalHeader/>
      
      <MainContent>
        {children}
      </MainContent>

      <footer className="none">
      </footer>
    </PageFrame>
  );
}