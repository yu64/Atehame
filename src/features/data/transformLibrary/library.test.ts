import variant from "@jitl/quickjs-singlefile-cjs-release-sync";
import {
  transformLibraryDeclaration,
  transformLibraryFunctions,
  transformPrelude,
} from "@src/features/data/transformLibrary/source";
import type { Atehame } from "@src/features/data/transformLibrary/types";
import typesSource from "@src/features/data/transformLibrary/types.ts?raw";
import { executeInQuickJS } from "@src/features/runtime/executeInQuickJS";
import { limits } from "@src/features/runtime/protocol";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import { describe, expect, it } from "vitest";

// 前置きのコードをそのまま実行して、公開される関数集を取り出す。
const { atehame } = new Function(transformPrelude)() as { atehame: Atehame };

describe("関数集の公開", () => {
  it("型宣言と同じ関数を公開する", () => {
    const declared = [...typesSource.matchAll(/^ {2}(\w+)\(/gm)].map(match => match[1]);
    expect(transformLibraryFunctions).toEqual(declared);
    expect(Object.keys(atehame)).toEqual(declared);
  });

  it("型宣言はモジュールでないスクリプトになる", () => {
    expect(transformLibraryDeclaration).not.toMatch(/^(export|import) /m);
    expect(transformLibraryDeclaration).toContain("declare const atehame: Atehame;");
  });

  it("QuickJS の中で使える", async () => {
    const quickjs = await newQuickJSWASMModuleFromVariant(variant);
    const code = [
      "return [",
      '  atehame.toKanjiNumber("1丁目23番4号"),',
      '  atehame.toFullWidth("A-1 ｶﾞｰﾃﾞﾝ"),',
      '  atehame.replaceHyphen("1ー2", "の"),',
      '  atehame.toPostalCode("〒150-0043"),',
      '  atehame.toJpEra("2019-05-01"),',
      "];",
    ].join("\n");
    const result = executeInQuickJS(
      quickjs,
      {
        code,
        inputJson: "null",
        timeoutMs: limits.timeoutMs,
        memoryLimitBytes: limits.memoryLimitBytes,
      },
      transformPrelude,
    );
    expect(result).toEqual({
      type: "result",
      outputJson: JSON.stringify([
        "一丁目二十三番四号",
        "Ａ－１　ガーデン",
        "1の2",
        "1500043",
        "令和元年5月1日",
      ]),
    });
  });
});

describe("toKanjiNumber", () => {
  it.each([
    ["1丁目23番4号", "一丁目二十三番四号"],
    ["１丁目２３番", "一丁目二十三番"],
    ["10", "十"],
    ["11", "十一"],
    ["105", "百五"],
    ["1500", "千五百"],
    ["2026", "二千二十六"],
    ["10000", "一万"],
    ["12345678", "千二百三十四万五千六百七十八"],
    ["100000001", "一億一"],
    ["0", "〇"],
    ["007", "七"],
    ["1.5", "一.五"],
  ])("位取り: %s → %s", (text, expected) => {
    expect(atehame.toKanjiNumber(text)).toBe(expected);
  });

  it.each([
    ["1丁目23番4号", "一丁目二三番四号"],
    ["105", "一〇五"],
    ["007", "〇〇七"],
  ])("1桁ずつ: %s → %s", (text, expected) => {
    expect(atehame.toKanjiNumber(text, { style: "digit" })).toBe(expected);
  });

  it("桁数が多すぎる数は1桁ずつ書く", () => {
    expect(atehame.toKanjiNumber("1".repeat(21))).toBe("一".repeat(21));
  });

  it("文字でない値", () => {
    expect(atehame.toKanjiNumber(23)).toBe("二十三");
    expect(atehame.toKanjiNumber(null)).toBe("");
    expect(atehame.toKanjiNumber(undefined)).toBe("");
  });

  it("不正な style は例外", () => {
    expect(() => atehame.toKanjiNumber("1", { style: "x" as "place" })).toThrow(TypeError);
  });
});

describe("toFullWidth / toHalfWidth", () => {
  it("全角にする", () => {
    expect(atehame.toFullWidth("A-1 ｶﾞｰﾃﾞﾝ 101号室")).toBe("Ａ－１　ガーデン　１０１号室");
    expect(atehame.toFullWidth("~!")).toBe("～！");
    expect(atehame.toFullWidth(null)).toBe("");
  });

  it("半角にする。カナはそのまま", () => {
    expect(atehame.toHalfWidth("ＡＢＣ１２３　ビル－")).toBe("ABC123 ビル-");
    expect(atehame.toHalfWidth("ｶﾞｰﾃﾞﾝ")).toBe("ｶﾞｰﾃﾞﾝ");
    expect(atehame.toHalfWidth(12)).toBe("12");
  });

  it("全角と半角を行き来しても元に戻る", () => {
    const ascii = "Hello, World! 1-2/3";
    expect(atehame.toHalfWidth(atehame.toFullWidth(ascii))).toBe(ascii);
  });
});

describe("replaceHyphen", () => {
  it("横棒をそろえる", () => {
    expect(atehame.replaceHyphen("1-2‐3－4−5―6–7", "の")).toBe("1の2の3の4の5の6の7");
  });

  it("数字に挟まれた長音記号もそろえる。カナの長音はそのまま", () => {
    expect(atehame.replaceHyphen("1ー2 ３ー４ 二ー三", "‐")).toBe("1‐2 ３‐４ 二‐三");
    expect(atehame.replaceHyphen("コーポ1ー2", "‐")).toBe("コーポ1‐2");
  });

  it("置き換える文字がなければ例外", () => {
    expect(() => (atehame.replaceHyphen as (text: string) => string)("1-2")).toThrow(TypeError);
  });
});

describe("toPostalCode", () => {
  it.each([
    ["1500043", "1500043"],
    ["150-0043", "1500043"],
    ["〒150-0043", "1500043"],
    ["〒 １５０－００４３", "1500043"],
    ["150ー0043", "1500043"],
    [600001, "0600001"],
    ["150-004", null],
    ["15000431", null],
    ["", null],
    [null, null],
    [1.5, null],
  ])("%s → %s", (value, expected) => {
    expect(atehame.toPostalCode(value)).toBe(expected);
  });

  it("ハイフンを付ける", () => {
    expect(atehame.toPostalCode("1500043", { hyphen: true })).toBe("150-0043");
  });
});

describe("toJpEra", () => {
  it.each([
    ["2026-10-13", "令和8年10月13日"],
    ["2026/1/5", "令和8年1月5日"],
    ["2026年10月13日", "令和8年10月13日"],
    ["２０２６－１０－１３", "令和8年10月13日"],
    ["2026-10-13T09:30:00", "令和8年10月13日"],
    ["2026-10-13 09:30", "令和8年10月13日"],
    ["2019-04-30", "平成31年4月30日"],
    ["2019-05-01", "令和元年5月1日"],
    ["1989-01-07", "昭和64年1月7日"],
    ["1989-01-08", "平成元年1月8日"],
    ["1926-12-24", "大正15年12月24日"],
    ["1926-12-25", "昭和元年12月25日"],
    ["1912-07-29", "明治45年7月29日"],
    ["1912-07-30", "大正元年7月30日"],
    ["1873-01-01", "明治6年1月1日"],
  ])("%s → %s", (date, expected) => {
    expect(atehame.toJpEra(date)).toBe(expected);
  });

  it.each([["1872-12-31"], ["2026-02-30"], ["2026-13-01"], ["令和8年"], [""], [null]])(
    "和暦にできない: %s",
    date => {
      expect(atehame.toJpEra(date)).toBeNull();
    },
  );

  it("書式と元年", () => {
    expect(atehame.toJpEra("2027-01-01", { format: "{era}{year}年 元旦" })).toBe("令和9年 元旦");
    expect(atehame.toJpEra("2019-05-01", { gannen: false })).toBe("令和1年5月1日");
    expect(atehame.toKanjiNumber(atehame.toJpEra("2026-10-13"))).toBe("令和八年十月十三日");
  });
});
