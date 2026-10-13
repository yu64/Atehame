import { inflateSync } from "node:zlib";

// 確認に必要な分だけ PDF を読む。Chrome（Skia）が出力する PDF を前提にしている。

// #############################################################################
// MARK: 定数

/** 1mm あたりのポイント数。 */
export const mmToPt = 72 / 25.4;

// #############################################################################
// MARK: ページ

/**
 * ページごとの大きさ（pt）と描画命令を返す。
 * @param {Buffer} pdf
 * @returns {{ width: number, height: number, content: string }[]}
 */
export function readPages(pdf) {
  const text = pdf.toString("latin1");
  const pages = [];
  for (const match of text.matchAll(/\d+ 0 obj\s*<<([\s\S]*?)>>\s*endobj/g)) {
    const dict = match[1];
    if (!/\/Type\s*\/Page\b/.test(dict)) continue;
    const box = dict.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
    const contents = dict.match(/\/Contents\s+(\d+) 0 R/);
    if (!box || !contents) throw new Error("ページの大きさか描画命令が見つかりません。");
    pages.push({
      width: Number(box[1]),
      height: Number(box[2]),
      content: readStream(text, contents[1]),
    });
  }
  return pages;
}

/**
 * 番号の付いたオブジェクトのストリームを、展開して返す。
 * @param {string} text PDF 全体（latin1）
 * @param {string} id オブジェクトの番号
 */
function readStream(text, id) {
  const match = text.match(
    new RegExp(`(?:^|\\s)${id} 0 obj\\s*<<[\\s\\S]*?>>\\s*stream\\r?\\n([\\s\\S]*?)endstream`),
  );
  if (!match) throw new Error(`オブジェクト ${id} のストリームが見つかりません。`);
  const data = Buffer.from(match[1], "latin1");
  try {
    return inflateSync(data).toString("latin1");
  } catch {
    return data.toString("latin1");
  }
}

// #############################################################################
// MARK: 塗り

/**
 * @typedef {{ color: [number, number, number], left: number, top: number, right: number, bottom: number }} Fill
 * 塗りつぶした四角。座標はページの左上を原点とした mm。
 */

/**
 * 描画命令から、四角の塗りつぶしを集める。
 * 対応する命令は q / Q / cm / rg / re / f / f* / n だけで、ほかは読み飛ばす。
 * @param {string} content ページの描画命令
 * @param {number} pageHeight ページの高さ（pt）
 * @returns {Fill[]}
 */
export function readFills(content, pageHeight) {
  /** @type {number[]} */
  let ctm = [1, 0, 0, 1, 0, 0];
  /** @type {number[][]} */
  const saved = [];
  /** @type {[number, number, number]} */
  let color = [0, 0, 0];
  /** @type {number[][]} */
  let path = [];
  /** @type {Fill[]} */
  const fills = [];
  /** @type {number[]} */
  let operands = [];

  for (const token of tokenize(content)) {
    if (typeof token === "number") {
      operands.push(token);
      continue;
    }
    switch (token) {
      case "q":
        saved.push(ctm);
        break;
      case "Q":
        ctm = saved.pop() ?? [1, 0, 0, 1, 0, 0];
        break;
      case "cm":
        ctm = multiply(/** @type {number[]} */ (operands.slice(-6)), ctm);
        break;
      case "rg":
        color = /** @type {[number, number, number]} */ (operands.slice(-3));
        break;
      case "re":
        path.push(transformRect(operands.slice(-4), ctm));
        break;
      case "f":
      case "f*":
        for (const [x0, y0, x1, y1] of path) {
          fills.push({
            color,
            left: x0 / mmToPt,
            top: (pageHeight - y1) / mmToPt,
            right: x1 / mmToPt,
            bottom: (pageHeight - y0) / mmToPt,
          });
        }
        path = [];
        break;
      case "n":
        path = [];
        break;
    }
    operands = [];
  }
  return fills;
}

/**
 * 命令を、数値と演算子の並びにする。文字列・名前・配列の括弧は読み飛ばす。
 * @param {string} content
 * @returns {Generator<number | string>}
 */
function* tokenize(content) {
  const pattern =
    /\((?:\\.|[^\\)])*\)|<[^>]*>|\/[^\s/<>[\]()]+|[[\]]|[-+]?(?:\d+\.?\d*|\.\d+)|[A-Za-z'"*]+/g;
  for (const [token] of content.matchAll(pattern)) {
    if (/^[-+.\d]/.test(token)) yield Number(token);
    else if (/^[A-Za-z'"]/.test(token)) yield token;
  }
}

/**
 * 変換行列の積（m のあとに n）。
 * @param {number[]} m
 * @param {number[]} n
 */
function multiply(m, n) {
  const [a, b, c, d, e, f] = m;
  const [p, q, r, s, t, u] = n;
  return [
    a * p + b * r,
    a * q + b * s,
    c * p + d * r,
    c * q + d * s,
    e * p + f * r + t,
    e * q + f * s + u,
  ];
}

/**
 * 四角（x, y, 幅, 高さ）を変換し、ページの座標で [左, 下, 右, 上] にする。
 * @param {number[]} rect
 * @param {number[]} ctm
 */
function transformRect([x, y, width, height], ctm) {
  const [a, b, c, d, e, f] = ctm;
  const xs = [];
  const ys = [];
  for (const [px, py] of [
    [x, y],
    [x + width, y],
    [x, y + height],
    [x + width, y + height],
  ]) {
    xs.push(a * px + c * py + e);
    ys.push(b * px + d * py + f);
  }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/**
 * 同じ色の塗りをまとめた外枠。見つからなければ undefined。
 * @param {Fill[]} fills
 * @param {[number, number, number]} color 0〜1 の RGB
 */
export function boundsOfColor(fills, color) {
  const matched = fills.filter(fill =>
    fill.color.every((value, index) => Math.abs(value - color[index]) < 0.003),
  );
  if (matched.length === 0) return undefined;
  return {
    left: Math.min(...matched.map(fill => fill.left)),
    top: Math.min(...matched.map(fill => fill.top)),
    right: Math.max(...matched.map(fill => fill.right)),
    bottom: Math.max(...matched.map(fill => fill.bottom)),
  };
}
