export interface PersistentStorageOptions<T> {
  /** 読み込んだ値を確かめる。正しくなければ undefined を返し、初めの値を使う。 */
  parse: (value: unknown) => T | undefined;
  /** 書き込むまで待つ時間（ms）。続けて変わった場合は、最後の値だけを書き込む。 */
  delayMs?: number;
  /** 書き込めなかったとき（容量の上限など）。 */
  onError?: (error: unknown) => void;
  /** 使う Storage。既定は localStorage。使えない環境では読み書きしない。 */
  storage?: () => Storage | undefined;
}

/**
 * 値を JSON にして localStorage に保存する入れ物（jotai の atomWithStorage に渡せる形）。
 *
 * - 書き込みは少し待ってまとめて行う。大きな値を、入力の1文字ごとに書き込まないため。
 *   ページを離れるとき（pagehide・非表示になったとき）は、待たずに書き込む。
 * - 読み込んだ値は parse で確かめ、壊れていれば使わない。
 * - 書き込めなくても例外にせず、onError で知らせる（画面の操作は続けられる）。
 */
export function createPersistentStorage<T>(options: PersistentStorageOptions<T>) {
  const delayMs = options.delayMs ?? 500;
  const getStorage =
    options.storage ?? (() => (typeof localStorage === "undefined" ? undefined : localStorage));
  const pending = new Map<string, T>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    const storage = getStorage();
    if (!storage) return;
    for (const [key, value] of pending) {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (error) {
        options.onError?.(error);
      }
    }
    pending.clear();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem(key: string, initialValue: T): T {
      if (pending.has(key)) return pending.get(key)!;
      try {
        const text = getStorage()?.getItem(key);
        if (text === null || text === undefined) return initialValue;
        return options.parse(JSON.parse(text)) ?? initialValue;
      } catch {
        return initialValue;
      }
    },
    setItem(key: string, value: T): void {
      pending.set(key, value);
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    removeItem(key: string): void {
      pending.delete(key);
      try {
        getStorage()?.removeItem(key);
      } catch (error) {
        options.onError?.(error);
      }
    },
    /** 待っている書き込みを、すぐに行う。 */
    flush,
  };
}
