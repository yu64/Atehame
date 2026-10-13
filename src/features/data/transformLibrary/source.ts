import librarySource from "@src/features/data/transformLibrary/library.js?raw";
import typesSource from "@src/features/data/transformLibrary/types.ts?raw";

// #############################################################################
// MARK: 定数

/** 関数集の名前（加工のコードから見えるグローバル変数）。 */
export const transformLibraryName = "atehame";

/** 関数集で公開する関数の名前（library.js の `export function`）。 */
export const transformLibraryFunctions = [
  ...librarySource.matchAll(/^export function (\w+)/gm),
].map(match => match[1]);

/**
 * 実行エンジンに渡す前置きのコード（関数の本体）。
 * library.js から export を取り除き、公開する関数を `atehame` として返す。
 */
export const transformPrelude = [
  withoutExports(librarySource),
  `return { ${transformLibraryName}: { ${transformLibraryFunctions.join(", ")} } };`,
].join("\n");

/** エディターの補完に渡す、関数集の型宣言。 */
export const transformLibraryDeclaration = [
  withoutExports(typesSource),
  `declare const ${transformLibraryName}: Atehame;`,
].join("\n");

// #############################################################################
// MARK: 内部関数

/** 行頭の `export ` を取り除き、モジュールでないスクリプトにする。 */
function withoutExports(source: string): string {
  return source.replace(/^export /gm, "");
}
