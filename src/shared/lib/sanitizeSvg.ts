// #############################################################################
// MARK: 定数

/** スクリプトの実行や、外部の読み込み、別の文書の埋め込みにつながる要素。 */
const blockedElements = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  // アニメーションで href などを書き換えられるため、アニメーションの要素も取り除く。
  "animate",
  "animatemotion",
  "animatetransform",
  "set",
  "discard",
  "handler",
  "listener",
]);

/** 文書の中（#id）以外を指す url(...)。 */
const externalUrlPattern = String.raw`url\(\s*(?!['"]?#)[^)]*\)`;

const hasExternalUrl = new RegExp(externalUrlPattern, "i");

// #############################################################################
// MARK: 関数

/**
 * SVG から、スクリプト・イベント属性・外部への参照を取り除く。
 * 画像として表示する SVG（img など）はブラウザがスクリプトを動かさないが、
 * 他人が作ったファイルも扱うため、多層防御として取り除く。SVG として読めなければ undefined。
 */
export function sanitizeSvg(source: string): string | undefined {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") return undefined;
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = doc.documentElement;
  if (
    !root
    || root.localName.toLowerCase() !== "svg"
    || doc.getElementsByTagName("parsererror").length > 0
  ) {
    return undefined;
  }

  for (const element of [root, ...root.querySelectorAll("*")]) {
    if (blockedElements.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      const isLink = name === "href" || name.endsWith(":href") || name === "src";
      if (
        name.startsWith("on")
        || (isLink && !value.startsWith("#"))
        || (name !== "style" && hasExternalUrl.test(value))
      ) {
        element.removeAttribute(attribute.name);
      } else if (name === "style") {
        element.setAttribute(attribute.name, attribute.value.replace(externalUrls(), "none"));
      }
    }
    if (element.localName.toLowerCase() === "style") {
      // 外部のスタイルの読み込みと、外部を指す url() を無効にする。
      element.textContent = (element.textContent ?? "")
        .replace(/@import[^;]*;?/gi, "")
        .replace(externalUrls(), "none");
    }
  }
  return new XMLSerializer().serializeToString(root);
}

// #############################################################################
// MARK: 内部関数

/** 外部の URL を探す正規表現。g フラグを使うため、毎回作り直す。 */
function externalUrls() {
  return new RegExp(externalUrlPattern, "gi");
}
