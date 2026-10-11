import Logo from "@src/app/Logo";
import MainContent from "@src/app/MainContent";
import NormalHeader from "@src/app/NormalHeader";
import PageFrame from "@src/app/PageFrame";
import { isDarkAtom } from "@src/app/store";
import SelectCard from "@src/shared/ui/SelectCard";
import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { navigate } from "vike/client/router";

export default function Page() {
  return (
    <PageFrame>
      <NormalHeader />

      <MainContent>
        <section
          className={`
          grid grid-cols-1 md:grid-cols-2 gap-6
          py-8
        `}
        >
          <div
            className={`
            md:col-span-2
          `}
          >
            <SelectCard
              title="標準レイアウトを使う"
              description="Atehameが提供するレイアウトを使用します。"
              buttonText="始める"
            />
          </div>
          <SelectCard
            title="レイアウトを作る"
            description="自分でレイアウトを作成します。"
            buttonText="始める"
            onClick={() => navigate("/edit/schema")}
          />
          <SelectCard
            title="レイアウトを使う"
            description="自分または他の人が作成したレイアウトを使用します。"
            buttonText="始める"
          />
        </section>
      </MainContent>
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
