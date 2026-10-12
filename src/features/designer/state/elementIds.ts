import type { LayoutDocument } from "@src/features/designer/layoutCss";

// #############################################################################
// MARK: クラス

/**
 * 部品ごとの固有の ID。名前を変えても、元に戻しても同じ部品を指すために使う。
 *
 * レイアウトは CSS だけで表すため、ID は CSS には書かず、デザイナーの中で文書の版ごとに
 * 「名前 → ID」の対応表として持つ。新しい版の対応表は前の版から名前で引き継ぎ、
 * 名前の変更は古い名前の ID を新しい名前へ引き継ぐ。元に戻すと前の版の文書がそのまま戻るため、
 * その版の対応表も一緒に戻る。保存はせず、読み込むたびに割り当て直す。
 */
export class ElementIds {
  #maps = new WeakMap<LayoutDocument, Map<string, string>>();
  #count = 0;

  /**
   * 文書の対応表を用意する。すでにあれば何もしない。
   * previous は前の版。renamed は、その変更が名前の変更だった場合の前後の名前。
   */
  register(
    layout: LayoutDocument,
    previous?: LayoutDocument,
    renamed?: { from: string; to: string },
  ): void {
    if (this.#maps.has(layout)) return;
    const base = (previous ? this.#maps.get(previous) : undefined);
    const map = new Map<string, string>();
    const used = new Set<string>();
    for (const { name } of layout.elements) {
      const inherited = (renamed?.to === name ? base?.get(renamed.from) : base?.get(name));
      const id = (inherited !== undefined && !used.has(inherited) ? inherited : this.#newId());
      used.add(id);
      map.set(name, id);
    }
    this.#maps.set(layout, map);
  }

  /** 部品の名前から ID を引く。 */
  idOf(layout: LayoutDocument, name: string): string | undefined {
    this.register(layout);
    return this.#maps.get(layout)!.get(name);
  }

  /** ID から今の部品の名前を引く。部品がなくなっていれば undefined。 */
  nameOf(layout: LayoutDocument, id: string): string | undefined {
    this.register(layout);
    for (const [name, value] of this.#maps.get(layout)!) {
      if (value === id) return name;
    }
    return undefined;
  }

  /** まだ使っていない ID を作る。 */
  #newId(): string {
    this.#count++;
    return `element-${this.#count}`;
  }
}
