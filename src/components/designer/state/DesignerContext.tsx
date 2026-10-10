import type { DesignerState, DesignerStore } from "@src/components/designer/state/designerStore";
import type { CssEditorComponent, ElementPreset } from "@src/components/designer/types";
import type { Values } from "@src/logic/render";
import { createContext, useContext, useSyncExternalStore } from "react";

/** Designer に渡された設定（props）。部品の雛形やプレビューの値など。 */
export interface DesignerConfig {
  fields: string[];
  sample: Values;
  presets: ElementPreset[];
  cssEditor?: CssEditorComponent;
}

export const DesignerStoreContext = createContext<DesignerStore | null>(null);
export const DesignerConfigContext = createContext<DesignerConfig | null>(null);

/**
 * デザイナーの状態。外には公開せず、用途ごとのフック（state/hooks.ts）からだけ使う。
 * Designer の外で使った場合は例外にする。
 */
export function useDesignerStore(): DesignerStore {
  const store = useContext(DesignerStoreContext);
  if (!store) throw new Error("Designer の中で使ってください。");
  return store;
}

/** 状態の一部を購読する。選んだ値が変わったときだけ再描画する。 */
export function useDesignerSelector<T>(select: (state: DesignerState) => T): T {
  const store = useDesignerStore();
  return useSyncExternalStore(store.subscribe, () => select(store.getState()));
}

export function useDesignerConfig(): DesignerConfig {
  const config = useContext(DesignerConfigContext);
  if (!config) throw new Error("Designer の中で使ってください。");
  return config;
}
