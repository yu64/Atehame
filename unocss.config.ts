import { defineConfig, presetIcons, presetWebFonts, presetWind4, symbols } from "unocss";
import { presetTheme } from "unocss-preset-theme";
import { presetDaisy } from "@ameinhardt/unocss-preset-daisy";

const themeConfig = {
  light: {
    colors: {
      primary: {
        DEFAULT: "#C0392B",
        hover: "#A93226",
      },
      base: {
        DEFAULT: "#F5F5F5",
        hover: "#EAEAEA",
        border: "#E5E5E5",
      },
      surface: {
        DEFAULT: "#FFFFFF",
        hover: "#FAFAFA",
        border: "#E5E5E5",
      },
      subtle: {
        DEFAULT: "#FAFAFA",
        hover: "#F4F4F4",
        border: "#E5E5E5",
      },

      text: {
        primary: "#1A1A1A",
        secondary: "#1A1A1A99",
        tertiary: "#1A1A1A59",
        inner: "#FFFFFF",
      },

      border: {
        strong: "#C8C3B8",
        DEFAULT: "#D8D3C8",
        subtle: "#E5E0D8",
      },
      status: {
        error: {
          DEFAULT: "#C0510A",
          bg: "#FDF0E8",
        },
        warning: {
          DEFAULT: "#A07800",
          bg: "#FDF8E8",
        },
        success: {
          DEFAULT: "#2E7D32",
          bg: "#EDF7EE",
        },
      },

      // base: {
      //   DEFAULT: "#FFFFFF",
      //   light: "#FAFAFA",
      // },
      // main: {
      //   DEFAULT: "#DC2626",
      // },
      // secondary: {
      //   DEFAULT: "#F97316",
      // },
      // accent: {
      //   move: "#F97316",
      //   focus: "#171717",
      // },
      // text: {
      //   primary: "#262626",
      //   secondary: "#737373",
      //   accent: "#DC2626",
      //   mute: "#A3A3A3",
      //   reverse: "#FFFFFF",
      // }

      // base: {
      //   "lv1": "oklch(99% 0 0)",      // 純白
      //   "lv2": "oklch(97% 0.01 240)",  // 少し沈んだ背景
      //   "lv3": "oklch(94% 0.02 240)"   // フォームやコードの背景
      // },
      // main: {
      //   "lv1": "oklch(35% 0 0)",      // 濃いグレー（本文）
      //   "lv2": "oklch(55% 0 0)",      // 中間（補足）
      //   "lv3": "oklch(75% 0 0)"       // 薄い（注釈）
      // },
      // accent: "oklch(55% 0.18 250)",  // 鮮やかなブルー
      // stroke: {
      //   "lv1": "oklch(92% 0 0)",
      //   "lv2": "oklch(88% 0 0)",
      //   "lv3": "oklch(84% 0 0)"
      // },
      // state: {
      //   unused: "oklch(70% 0.05 250)",
      //   success: "oklch(65% 0.18 150)", // Success追加
      //   warn: "oklch(75% 0.18 70)",
      //   error: "oklch(65% 0.22 25)"
      // }
    },
  },
  dark: {
    colors: {
      // base: {
      //   "lv1": "oklch(25% 0.02 240)", // 濃紺グレー
      //   "lv2": "oklch(29% 0.02 240)", // より深い
      //   "lv3": "oklch(32% 0.02 240)"  // 最深部
      // },
      // main: {
      //   "lv1": "oklch(95% 0 0)",      // ほぼ白（本文）
      //   "lv2": "oklch(80% 0 0)",      // 明るいグレー（補足）
      //   "lv3": "oklch(60% 0 0)"       // 沈んだグレー（注釈）
      // },
      // accent: "oklch(70% 0.14 250)",  // ダークモードで映える少し明るい青
      // stroke: {
      //   "lv1": "oklch(33% 0.02 240)",
      //   "lv2": "oklch(37% 0.02 240)",
      //   "lv3": "oklch(41% 0.02 240)"
      // },
      // state: {
      //   unused:  "oklch(55% 0.05 250)",
      //   success: "oklch(75% 0.15 150)",
      //   warn:    "oklch(80% 0.15 70)",
      //   error:   "oklch(70% 0.18 25)"
      // }
    },
  },
} as const satisfies Record<string, object>;

export default defineConfig({
  content: {
    pipeline: {
      // 既定では .ts を探さないため、部品の雛形（.ts）に書いたアイコンのクラスも対象にする。
      include: [/\.([jt]sx?|mdx?|html)($|\?)/],
    },
  },
  presets: [
    presetWind4({
      // dark: "media"
    }),
    presetIcons({
      collections: {
        lucide: () => import("@iconify-json/lucide/icons.json").then(module => module.default),
      },
    }),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: "Noto Sans JP:400,700",
        mono: "Fira Code:400,500",
      },
    }),
    // アプリの配色はいまは明るいものだけのため、daisyUI も prefers-color-scheme で
    // 暗い配色に切り替わらないよう light に固定する。
    presetDaisy({ themes: ["light --default"] }),
    presetTheme({
      theme: {
        dark: themeConfig.dark,
      },
    }) as any,
  ],
  layers: {
    properties: 10,
    "daisyui.l1": 20,
    "daisyui.l1.l2": 30,
    "daisyui.l1.l2.l3": 40,
    shortcuts: 50,
    default: 60,
  },
  theme: themeConfig.light,
  variants: [
    // has-focus-visible
    matcher => {
      const prefix = "has-focus-visible:";
      if (!matcher.startsWith(prefix)) return matcher;
      return {
        matcher: matcher.slice(prefix.length),
        selector: s => `${s}:has(:focus-visible)`,
      };
    },
    // select:open
    matcher => {
      const prefix = "select-open:";
      if (!matcher.startsWith(prefix)) return matcher;
      return {
        matcher: matcher.slice(prefix.length),
        selector: s => `${s}:open`,
      };
    },
  ],
  rules: [
    // [
    //   /^appearance-base-select$/,
    //   (_) => ([
    //     {
    //       "appearance": "base-select"
    //     },
    //     {
    //       [symbols.selector]: (selector) => `${selector}::picker(select):hover`,
    //       "appearance": "base-select"
    //     }
    //   ]),
    //   { autocomplete: "appearance-base-select" }
    // ]
    // [/^atehame-(lv1|lv2|lv3)$/, ([, lv], { theme }) => {
    //   const bg = theme.colors.base[lv as keyof typeof theme.colors.base];
    //   const border = theme.colors.stroke[lv as keyof typeof theme.colors.stroke];
    //   const text = theme.colors.main.lv1;
    //   return {
    //     "background-color": bg,
    //     "border-color": border,
    //     "color": text
    //   };
    // }],
    // [/^atehame-(unused|warn|error)$/, ([, name], { theme }) => {
    //   const color = theme.colors.state[name as keyof typeof theme.colors.state];
    //   if (!color) throw new Error();
    //   const alphaColor = `color-mix(in srgb, ${color} 10%, transparent)`;
    //   return {
    //     // 下層の背景色(background-color)を活かすため、gradientで膜を張る
    //     "background-image": `linear-gradient(${alphaColor}, ${alphaColor})`,
    //     "border-color": color,
    //     "color": color
    //   };
    // }],
  ],
  shortcuts: [
    [
      "atehame-focus",
      `
        outline-solid
        outline-2
        -outline-offset-1
        outline-primary
      `,
    ],
    [
      "atehame-btn-primary",
      `
        btn bg-primary text-text-inner
        hover:bg-primary-hover
        transition-colors duration-300
        focus-visible:outline-solid
        focus-visible:outline-2
        focus-visible:-outline-offset-4
        focus-visible:outline-surface
        disabled:opacity-40
        disabled:hover:bg-primary
        disabled:cursor-not-allowed
      `,
    ],
    [
      "atehame-btn-secondary",
      `
        btn bg-surface text-text-primary
        hover:bg-surface-hover
        transition-colors duration-300
        focus-visible:atehame-focus
        disabled:opacity-40
        disabled:bg-base
        disabled:hover:bg-base
        disabled:border-base-border
        disabled:shadow-none
        disabled:cursor-not-allowed
      `,
    ],
    // --- UI構成部品 (Components) ---

    // // パネル:
    // // min-h-screen を削除。
    // //「背景が塗られる器」としての性質（遷移アニメーション等）のみを保持。
    // ["atehame-panel", `
    //   w-full
    //   transition-colors duration-300
    // `],

    // // カード:
    // // 「枠を持つ独立した面」としての造形。
    // ["atehame-card", `
    //   card card-md p-4 border
    //   transition-colors duration-300
    // `],

    // // ラベル:
    // // 文字の基本骨格。
    // ["atehame-label", `
    //   text-sm font-medium leading-none tracking-tight
    //   transition-colors duration-300
    // `],

    // // バッジ:
    // // 境界線（border）を含めることで、layer の枠線色があてはまるように。
    // ["atehame-badge", `
    //   badge badge-outline
    //   text-xs border
    //   transition-colors duration-300
    // `]
  ],
});
