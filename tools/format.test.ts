import { formatText } from "./format.mjs";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

/** 見本を整形するときのファイル名。設定（Prettier・ESLint）を選ぶためだけに使う。 */
const filePath = "src/formatFixture.tsx";

/** 見本のファイルを読む。 */
function fixture(name: string) {
  return readFileSync(new URL(`./fixtures/format/${name}`, import.meta.url), "utf8");
}

describe("整形の見本", () => {
  test("決めた形に整形する", { timeout: 30_000 }, async () => {
    expect(await formatText(fixture("input.tsx"), filePath)).toBe(fixture("expected.tsx"));
  });

  test("整形した結果に、もう一度かけても変わらない", { timeout: 30_000 }, async () => {
    const expected = fixture("expected.tsx");
    expect(await formatText(expected, filePath)).toBe(expected);
  });
});
