import { defineConfig, presetIcons, presetWebFonts, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Noto Sans JP:400,700',
        mono: 'Fira Code:400,500',
      },
    }),
  ],
  theme: {
    colors: {
      // インクネイビーを基調としたライトテーマ設定
      brand: {
        primary: '#312e81', // Indigo 900
        accent: '#4f46e5',  // Indigo 600
      },
      ui: {
        bg: '#f1f5f9',      // Slate 100
        panel: '#ffffff',   // White
        border: '#e2e8f0',  // Slate 200
        text: '#0f172a',    // Slate 900
        muted: '#64748b',   // Slate 500
        // ステータスカラー
        error: '#dc2626',
        warn: '#d97706',
        empty: '#94a3b8',
      }
    }
  },
  shortcuts: [
    // レイアウト共通
    ['atehame-bg', 'bg-ui-bg text-ui-text min-h-screen'],
    ['atehame-panel', 'bg-ui-panel border-ui-border shadow-sm'],
    
    // バリデーション状態
    ['card-error', 'border-ui-error/40 bg-ui-error/5 text-ui-error ring-1 ring-ui-error/10'],
    ['card-warn', 'border-ui-warn/40 bg-ui-warn/5 text-ui-warn ring-1 ring-ui-warn/10'],
    ['card-empty', 'border-ui-empty/30 text-ui-empty opacity-70'],

    // ラベル等の小要素
    ['text-label', 'text-[10px] font-black uppercase tracking-widest text-ui-muted'],
    ['input-base', 'bg-transparent border-b border-ui-border focus:border-brand-accent outline-none transition-colors'],
  ]
})
