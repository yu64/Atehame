import {
  addElementRule,
  duplicateElementRule,
  moveElementRule,
  renameElement,
  setDeclaration,
  setDeclarations,
  type RuleTarget,
} from "@src/features/designer/layoutCss/edit";
import {
  parseLayoutCss,
  readPageSize,
  type ElementRule,
  type LayoutCss,
  type PageSize,
} from "@src/features/designer/layoutCss/parse";
import { removeElementRule } from "@src/features/designer/layoutCss/remove";

/**
 * レイアウトの CSS と、その解析結果。
 *
 * 不変（immutable）で、書き換えると新しい文書を返す。CSS が変わらなければ同じ文書を返すため、
 * 参照の比較で変更の有無がわかる（React の再描画や、元に戻すの履歴はこれを前提にしている）。
 * 解析は初めて必要になったときに1回だけ行う。
 */
export class LayoutDocument {
  readonly css: string;
  #parsed: LayoutCss | undefined;

  private constructor(css: string) {
    this.css = css;
  }

  static from(css: string): LayoutDocument {
    return new LayoutDocument(css);
  }

  /** 解析結果。位置の情報はこの文書の css に対するもの。 */
  get parsed(): LayoutCss {
    this.#parsed ??= parseLayoutCss(this.css);
    return this.#parsed;
  }

  /** 部品の定義（CSS の記述順＝重なり順）。 */
  get elements(): ElementRule[] {
    return this.parsed.elements;
  }

  element(name: string): ElementRule | undefined {
    return this.elements.find(element => element.name === name);
  }

  /** @page の size から読んだ用紙の大きさ（mm）。指定がなければ undefined。 */
  get pageSize(): PageSize | undefined {
    return readPageSize(this.parsed);
  }

  /** CSS を置き換えた文書。同じ CSS なら自身を返す。 */
  withCss(css: string): LayoutDocument {
    return css === this.css ? this : new LayoutDocument(css);
  }

  /** 宣言の値を設定する。value が undefined なら宣言を取り除く。 */
  setDeclaration(target: RuleTarget, property: string, value: string | undefined): LayoutDocument {
    return this.withCss(setDeclaration(this.css, target, property, value, this.parsed));
  }

  setDeclarations(
    target: RuleTarget,
    entries: Array<[property: string, value: string | undefined]>,
  ): LayoutDocument {
    return this.withCss(setDeclarations(this.css, target, entries));
  }

  /** 部品を末尾（最前面）に追加する。nestedCss は規則の中に入れ子で書く。 */
  addElement(
    name: string,
    declarations: Array<[property: string, value: string]>,
    nestedCss?: string,
  ): LayoutDocument {
    return this.withCss(addElementRule(this.css, name, declarations, nestedCss));
  }

  /** 部品と、その部品だけを指定する規則を取り除く。 */
  removeElement(name: string): LayoutDocument {
    return this.withCss(removeElementRule(this.css, name, this.parsed));
  }

  /** 部品の名前を変える（その名前を指定するすべてのセレクタを書き換える）。 */
  renameElement(from: string, to: string): LayoutDocument {
    return this.withCss(renameElement(this.css, from, to));
  }

  /** 部品を直後に複製し、名前と位置（mm）を変える。 */
  duplicateElement(
    name: string,
    newName: string,
    offset: { left: number; top: number },
  ): LayoutDocument {
    return this.withCss(duplicateElementRule(this.css, name, newName, offset, this.parsed));
  }

  /** 部品を最前面か最背面に移す。 */
  moveElement(name: string, to: "front" | "back"): LayoutDocument {
    return this.withCss(moveElementRule(this.css, name, to, this.parsed));
  }
}
