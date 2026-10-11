import { useDesignerConfig, useDesignerStore } from "@src/features/designer/state/DesignerContext";
import type { ElementPreset } from "@src/features/designer/types";

/** 部品の追加。状態は購読しない。 */
export function useAddElement(): (preset: ElementPreset, key?: string) => void {
  const store = useDesignerStore();
  const { fields } = useDesignerConfig();
  /** 雛形から追加する。key を指定すると、その値を埋め込む。 */
  return (preset, key) => store.add(preset, fields, key);
}

export default useAddElement;
