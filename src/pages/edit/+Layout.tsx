import { PageFrame } from "@src/components/PageFrame";



export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <PageFrame>
      <header className={`
        flex flex-row
        text-text-accent
        border-b-2 border-bg-accent
        sticky top-0 z-50
        h-16 w-full
      `}>
         <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-bg-accent flex items-center justify-center rotate-45">
                <div className="w-3 h-3 border-2 border-white rotate-45"></div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-bg-accent uppercase">Atehame</span>
        </div>

      </header>
      
      <main className={`
        grow
        w-full
      `}>
        {children}
      </main>

      <footer className="none">
      </footer>
    </PageFrame>
  );
}