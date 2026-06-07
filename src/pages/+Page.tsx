import { PageFrame } from '@src/components/PageFrame';
import { SelectCard } from '@src/components/SelectCard';
import { isDarkAtom } from '@src/store/atom';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';

export function Page() {

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
      `}>
        <section className={`
          grid grid-cols-1 md:grid-cols-2 gap-6
          py-8
        `}>
          <div className={`
            md:col-span-2
          `}>
            <SelectCard
              title='標準レイアウトを使う'
              description='Atehameが提供するレイアウトを使用します。'
              buttonText='始める'
            />
          </div>
          <SelectCard
            title='レイアウトを作る'
            description='自分でレイアウトを作成します。'
            buttonText='始める'
          />
          <SelectCard
            title='レイアウトを使う'
            description='自分または他の人が作成したレイアウトを使用します。'
            buttonText='始める'
          />
        </section>

      </main>

      <footer className="none">
      </footer>
    </PageFrame>
  );
}

// {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//     <div className="flex justify-between h-16 items-center">
//         <div className="flex items-center space-x-3">
//             <div className="w-6 h-6 bg-main flex items-center justify-center rotate-45">
//                 <div className="w-3 h-3 border-2 border-white -rotate-45"></div>
//             </div>
//             <span className="text-2xl font-black font-logo tracking-tighter text-main uppercase">Atehame</span>
//         </div> */}
//         {/* <nav className="hidden md:flex space-x-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
//             <a href="#" className="hover:text-main transition">Engine Specs</a>
//             <a href="#" className="hover:text-main transition">Template Library</a>
//             <a href="#" className="hover:text-main transition">Developers</a>
//         </nav>
//         <div className="flex items-center space-x-6">
//             <button className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-main">Console</button>
//             <button className="btn-red px-6 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-[0.15em]">
//                 Start Layout
//             </button>
//         </div> */}
//     {/* </div> */}
// {/* </div> */}