/** 状態を読み、変化を購読できるもの。React では useStoreSelector で使う。 */
export interface ReadableStore<S> {
  getState(): S;
  subscribe(listener: () => void): () => void;
}

/**
 * React に依存しない、購読できる状態の入れ物。
 * 状態は不変（immutable）として扱い、変えるときは新しい値に差し替える。
 * 書き換えの手段は継承したクラスが決める（外からは読むことと購読だけができる）。
 */
export class Store<S> implements ReadableStore<S> {
  #state: S;
  #listeners = new Set<() => void>();

  constructor(initial: S) {
    this.#state = initial;
  }

  getState = (): S => this.#state;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  /** 状態を差し替えて購読者に知らせる。同じ値なら何もせず false を返す。 */
  protected replaceState(next: S): boolean {
    if (next === this.#state) return false;
    this.#state = next;
    this.#listeners.forEach(listener => listener());
    return true;
  }
}
