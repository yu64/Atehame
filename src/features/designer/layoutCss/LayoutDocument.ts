import { type Assets, emptyAssets, type LayoutAsset } from "@src/features/designer/assets/assets";
import { decodeCssString } from "@src/features/designer/layoutCss/cssString";
import {
  addElementRule,
  duplicateElementRule,
  moveElementRule,
  renameElement,
  replaceStringValues,
  type RuleTarget,
  setDeclaration,
  setDeclarations,
} from "@src/features/designer/layoutCss/edit";
import {
  type ElementRule,
  imageProperty,
  type LayoutCss,
  type PageSize,
  parseLayoutCss,
  readPageSize,
} from "@src/features/designer/layoutCss/parse";
import { removeElementRule } from "@src/features/designer/layoutCss/remove";

// #############################################################################
// MARK: クラス

/**
 * レイアウトの CSS と、その解析結果。画像（アセット）も一緒に持つ。
 *
 * 不変（immutable）で、書き換えると新しい文書を返す。CSS が変わらなければ同じ文書を返すため、
 * 参照の比較で変更の有無がわかる（React の再描画や、元に戻すの履歴はこれを前提にしている）。
 * 解析は初めて必要になったときに1回だけ行う。
 */
export class LayoutDocument {
  readonly css: string;
  /** 画像。部品は `--atehame-image: "名前";` で参照する。 */
  readonly assets: Assets;
  #parsed: LayoutCss | undefined;

  private constructor(css: string, assets: Assets, parsed?: LayoutCss) {
    this.css = css;
    this.assets = assets;
    this.#parsed = parsed;
  }

  /** CSS とアセットから文書を作る。CSS はまだ解析しない。 */
  static from(css: string, assets: Assets = emptyAssets): LayoutDocument {
    return new LayoutDocument(css, assets);
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

  /** 名前の部品。なければ undefined。 */
  element(name: string): ElementRule | undefined {
    return this.elements.find(element => element.name === name);
  }

  /** @page の size から読んだ用紙の大きさ（mm）。指定がなければ undefined。 */
  get pageSize(): PageSize | undefined {
    return readPageSize(this.parsed);
  }

  /** CSS を置き換えた文書。同じ CSS なら自身を返す。 */
  withCss(css: string): LayoutDocument {
    return (css === this.css ? this : new LayoutDocument(css, this.assets));
  }

  /** 画像を置き換えた文書。CSS はそのままなので、解析結果も引き継ぐ。 */
  withAssets(assets: Assets): LayoutDocument {
    return (assets === this.assets ? this : new LayoutDocument(this.css, assets, this.#parsed));
  }

  /** 画像を登録する。同じ名前があれば置き換える（差し替え）。 */
  setAsset(name: string, asset: LayoutAsset): LayoutDocument {
    return this.withAssets({
      ...this.assets,
      [name]: asset,
    });
  }

  /** 画像を取り除く。参照している部品はそのまま残る（画像が見つからない状態になる）。 */
  removeAsset(name: string): LayoutDocument {
    if (!(name in this.assets)) return this;
    const { [name]: _removed, ...rest } = this.assets;
    return this.withAssets(rest);
  }

  /** 画像の名前を変え、参照している部品の `--atehame-image` も書き換える。 */
  renameAsset(from: string, to: string): LayoutDocument {
    const asset = this.assets[from];
    if (asset === undefined || from === to || to in this.assets) return this;
    const assets = Object.fromEntries(
      Object.entries(this.assets).map(([name, value]) => [(name === from ? to : name), value]),
    );
    return LayoutDocument.from(replaceStringValues(this.css, imageProperty, from, to), assets);
  }

  /** 画像を参照している部品の名前。 */
  assetUsage(name: string): string[] {
    return this.elements
      .filter(
        element => decodeCssString(element.declarations.get(imageProperty)?.value ?? "") === name,
      )
      .map(element => element.name);
  }

  /** 宣言の値を設定する。value が undefined なら宣言を取り除く。 */
  setDeclaration(target: RuleTarget, property: string, value: string | undefined): LayoutDocument {
    return this.withCss(setDeclaration(this.css, target, property, value, this.parsed));
  }

  /** 部品または @page に、複数の宣言をまとめて設定した文書を返す。 */
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
