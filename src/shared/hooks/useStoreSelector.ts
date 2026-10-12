import type { ReadableStore } from "@src/shared/lib/store";
import { useSyncExternalStore } from "react";

/**
 * store の状態の一部を購読する。選んだ値が変わったときだけ再描画する。
 * select は同じ状態から同じ値（参照）を返すこと。毎回新しい配列やオブジェクトを作ると、描画が止まらなくなる。
 */
export function useStoreSelector<S, T>(store: ReadableStore<S>, select: (state: S) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(store.getState()));
}
