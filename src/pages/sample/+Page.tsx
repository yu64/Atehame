import { isDarkAtom } from '@src/store/atom';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';

export function Page() {

  const [dark, setDark] = useAtom(isDarkAtom);

  useEffect(() => {
    const root = window.document.documentElement;
    dark ? root.classList.add('dark') : root.classList.remove('dark');
  }, [dark]);

  return (
    <div className="atehame-panel atehame-lv1 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Atehame UI Verification</h1>
          <button onClick={() => setDark(!dark)} className="btn btn-outline">
            {dark ? 'Dark Mode' : 'Light Mode'}
          </button>
        </header>

        <section className='space-y-4'>
          <div className='atehame-card atehame-lv1'>
            カードLv1
          </div>
          <div className='atehame-card atehame-lv2'>
            カードLv2
          </div>
          <div className='atehame-card atehame-lv3'>
            カードLv3
          </div>
        </section>

        <section className='space-y-4'>
          <div className='atehame-card atehame-lv1'>
            カード
            <div className='atehame-card atehame-lv2'>
              カード
              <div className='atehame-card atehame-lv3'>
                カード
              </div>
            </div>
          </div>
        </section>

        <section className='space-y-4'>
          <div className='atehame-card atehame-lv2 atehame-unused'>
            未使用
          </div>
          <div className='atehame-card atehame-lv2 atehame-warn'>
            警告
          </div>
          <div className='atehame-card atehame-lv2 atehame-error'>
            エラー
          </div>
        </section>

        <section className='space-y-4'>
          <div className='atehame-card atehame-lv2'>
            <span className='atehame-badge atehame-lv2 atehame-unused'>Unused</span>
          </div>
          <div className='atehame-card atehame-lv2'>
            <span className='atehame-badge atehame-lv2 atehame-warn'>Warning</span>
          </div>
          <div className='atehame-card atehame-lv2'>
            <span className='atehame-badge atehame-lv2 atehame-error'>Error</span>
          </div>
        </section>
        
      </div>
    </div>
  );
}