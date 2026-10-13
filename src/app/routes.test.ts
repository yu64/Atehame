import { routes } from "@src/app/routes";
import { existsSync } from "node:fs";
import { describe, expect, test } from "vitest";

const pagesDir = new URL("../pages/", import.meta.url);

/** routes の中の URL をすべて集める。 */
function urlsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  return Object.values(value as object).flatMap(urlsOf);
}

describe("画面の URL", () => {
  test.each(urlsOf(routes))("%s のページがある", url => {
    const page = new URL(`.${url}/+Page.tsx`.replace("//", "/"), pagesDir);
    expect(existsSync(page)).toBe(true);
  });

  test("同じ URL が2つない", () => {
    const urls = urlsOf(routes);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
