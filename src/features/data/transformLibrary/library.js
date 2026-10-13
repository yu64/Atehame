// 加工のコードから `atehame.関数名` で使える関数集。QuickJS の中で、ユーザーのコードの前に実行する。
// このファイルは文字列のまま QuickJS に渡す（source.ts）。import は使えない。
// `export function` が公開する関数になる。型と説明は types.ts に書く（エディターの補完に使う）。
// 一度公開した関数の動きは変えない（保存したテンプレートが依存するため）。直すときは別の名前で足す。

// #############################################################################
// MARK: 定数

const kanjiDigits = "〇一二三四五六七八九";

/** 4桁ごとの単位。これを超える桁数の数は、位取りせずに1桁ずつ書く。 */
const largeUnits = ["", "万", "億", "兆", "京"];

/** 4桁の中の単位（千・百・十・一の位）。 */
const smallUnits = ["千", "百", "十", ""];

/** 区切りとして扱う横棒（ハイフン・ダッシュ・マイナス）。 */
const hyphenPattern = /[-\u2010-\u2015\u2212\ufe58\ufe63\uff0d]/g;

/** 数字に挟まれた長音記号（「1ー2」の打ち間違い）。 */
const longVowelPattern =
  /(?<=[0-9０-９〇一二三四五六七八九十百千])[ーｰ](?=[0-9０-９〇一二三四五六七八九十])/g;

/** 元号と、その始まりの日（年×10000＋月×100＋日）。新しい順。 */
const eras = [
  ["令和", 20190501],
  ["平成", 19890108],
  ["昭和", 19261225],
  ["大正", 19120730],
  ["明治", 18680125],
];

/** 和暦にできる最も古い日。日本が太陽暦にした明治6年1月1日。 */
const firstGregorianDate = 18730101;

// #############################################################################
// MARK: 文字

/**
 * 文字の中の数字（半角・全角）を漢数字にする。
 * @param {unknown} text
 * @param {{ style?: "place" | "digit" }} [options]
 */
export function toKanjiNumber(text, options = {}) {
  const style = options.style ?? "place";
  if (style !== "place" && style !== "digit") {
    throw new TypeError('style は "place" か "digit" にしてください。');
  }
  return toText(text).replace(/[0-9０-９]+/g, digits => {
    const halfDigits = toHalfWidth(digits);
    return (style === "digit" ? digitsToKanji(halfDigits) : placeToKanji(halfDigits));
  });
}

/**
 * 英数字・記号・空白を全角に、半角カナを全角カナにする。
 * @param {unknown} text
 */
export function toFullWidth(text) {
  return toText(text)
    .replace(/[!-~]/g, char => String.fromCharCode(char.charCodeAt(0) + 0xfee0))
    .replace(/ /g, "\u3000")
    .replace(/[\uff61-\uff9f]+/g, kana => kana.normalize("NFKC"));
}

/**
 * 全角の英数字・記号・空白を半角にする。カナはそのまま。
 * @param {unknown} text
 */
export function toHalfWidth(text) {
  return toText(text)
    .replace(/[！-～]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ");
}

/**
 * ハイフンやダッシュなどの横棒を、指定した文字にそろえる。数字に挟まれた長音記号「ー」も含む。
 * @param {unknown} text
 * @param {string} replacement
 */
export function replaceHyphen(text, replacement) {
  if (typeof replacement !== "string") {
    throw new TypeError("置き換える文字を指定してください。");
  }
  return toText(text).replace(hyphenPattern, replacement).replace(longVowelPattern, replacement);
}

// #############################################################################
// MARK: 郵便番号

/**
 * 郵便番号を7桁の数字にする。7桁にならなければ null。
 * 「〒」・空白・横棒は取り除き、全角の数字は半角にする。数値は先頭の0を補う。
 * @param {unknown} value
 * @param {{ hyphen?: boolean }} [options]
 */
export function toPostalCode(value, options = {}) {
  const text = (
    (typeof value === "number" && Number.isInteger(value) && value >= 0)
    ? String(value).padStart(7, "0")
    : replaceHyphen(toHalfWidth(value), "").replace(/[〒\s]/g, "")
  );
  if (!/^\d{7}$/.test(text)) return null;
  return (options.hyphen ? `${text.slice(0, 3)}-${text.slice(3)}` : text);
}

// #############################################################################
// MARK: 日付

/**
 * 日付を和暦にする。読めない日付や、明治6年より前の日付は null。
 * 日付は「2026-10-13」「2026/10/13」「2026年10月13日」の形（後ろに時刻があってもよい）。
 * @param {unknown} date
 * @param {{ format?: string, gannen?: boolean }} [options]
 */
export function toJpEra(date, options = {}) {
  const parsed = parseDate(date);
  if (!parsed) return null;
  const { year, month, day } = parsed;
  const value = year * 10000 + month * 100 + day;
  if (value < firstGregorianDate) return null;

  const [era, start] = eras.find(([, eraStart]) => value >= eraStart);
  const eraYear = year - Math.floor(start / 10000) + 1;
  const yearText = (eraYear === 1 && options.gannen !== false ? "元" : String(eraYear));
  return (options.format ?? "{era}{year}年{month}月{day}日")
    .replaceAll("{era}", era)
    .replaceAll("{year}", yearText)
    .replaceAll("{month}", String(month))
    .replaceAll("{day}", String(day));
}

// #############################################################################
// MARK: 内部関数

/**
 * 値を文字にする。null と undefined は空の文字。
 * @param {unknown} value
 */
function toText(value) {
  return (value === null || value === undefined ? "" : String(value));
}

/**
 * 数字を1桁ずつ漢数字にする（0は〇）。
 * @param {string} digits 半角の数字
 */
function digitsToKanji(digits) {
  return digits.replace(/\d/g, digit => kanjiDigits[Number(digit)]);
}

/**
 * 数字を位取りした漢数字にする（例: 1500 → 千五百、10000 → 一万）。
 * 京を超える桁数の数は、1桁ずつ書く。
 * @param {string} digits 半角の数字
 */
function placeToKanji(digits) {
  const trimmed = digits.replace(/^0+/, "");
  if (trimmed === "") return kanjiDigits[0];
  if (trimmed.length > largeUnits.length * 4) return digitsToKanji(trimmed);

  const padded = trimmed.padStart(Math.ceil(trimmed.length / 4) * 4, "0");
  let result = "";
  for (let start = 0; start < padded.length; start += 4) {
    const group = padded.slice(start, start + 4);
    if (group === "0000") continue;
    result += groupToKanji(group) + largeUnits[(padded.length - start) / 4 - 1];
  }
  return result;
}

/**
 * 4桁の数字を、千・百・十を使った漢数字にする。千・百・十の前の「一」は書かない。
 * @param {string} group 4桁の半角の数字
 */
function groupToKanji(group) {
  let result = "";
  for (const [index, char] of [...group].entries()) {
    const digit = Number(char);
    if (digit === 0) continue;
    const unit = smallUnits[index];
    result += (digit === 1 && unit !== "" ? "" : kanjiDigits[digit]) + unit;
  }
  return result;
}

/**
 * 日付の文字を、年・月・日にする。読めなければ undefined。
 * @param {unknown} date
 */
function parseDate(date) {
  const match = toHalfWidth(date)
    .trim()
    .match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?:[T\s].*)?$/);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  const valid = (
    check.getUTCFullYear() === year
    && check.getUTCMonth() === month - 1
    && check.getUTCDate() === day
  );
  return (
    valid
    ? {
      year,
      month,
      day,
    }
    : undefined
  );
}
