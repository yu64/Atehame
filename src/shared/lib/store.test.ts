import { Store } from "@src/shared/lib/store";
import { describe, expect, test, vi } from "vitest";

class Counter extends Store<{ count: number }> {
  constructor() {
    super({ count: 0 });
  }
  increment = () => this.replaceState({ count: this.getState().count + 1 });
  keep = () => this.replaceState(this.getState());
}

describe("Store", () => {
  test("状態を差し替えたときだけ購読者に知らせる", () => {
    const counter = new Counter();
    const listener = vi.fn();
    const unsubscribe = counter.subscribe(listener);

    expect(counter.keep()).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    expect(counter.increment()).toBe(true);
    expect(counter.getState()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    counter.increment();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
