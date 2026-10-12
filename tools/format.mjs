// @ts-check
/**
 * ESLint の --fix → Prettier → ESLint の --fix の順に整形する（三項演算子の形は ESLint のルールが最後に決める）。
 *
 *   node tools/format.mjs          整形して書き込む
 *   node tools/format.mjs --check  整形が必要なファイルを表示し、あれば終了コード 1
 *
 * Prettier だけを単独でかけると三項演算子の形が戻るため、整形は必ずこのスクリプトで行う。
 */
import { ESLint } from "eslint";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import * as prettier from "prettier";

const check = process.argv.includes("--check");
const lintable = new Set([".ts", ".tsx", ".mjs", ".js"]);

/** Git が管理している（または無視していない新しい）ファイル。 */
function listFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      encoding: "utf8",
    },
  );
  return output.split("\0").filter(Boolean);
}

async function main() {
  const eslint = new ESLint({ fix: true });
  const changed = [];

  for (const file of listFiles()) {
    const info = await prettier.getFileInfo(file, { ignorePath: ".prettierignore" });
    if (info.ignored || !info.inferredParser) continue;

    let source;
    try {
      source = await readFile(file, "utf8");
    } catch {
      continue; // 削除済み
    }
    const lint = lintable.has(extname(file)) && !(await eslint.isPathIgnored(file));
    /** ESLint の --fix をかけた結果。 */
    async function fix(text) {
      if (!lint) return text;
      const [result] = await eslint.lintText(text, { filePath: file });
      return result?.output ?? text;
    }
    const options = await prettier.resolveConfig(file);

    // 1. import の並び替えなどを先に直す（ESLint の直し方は空白を詰めることがあるので、後で Prettier が整える）。
    // 2. Prettier で整形する。
    // 3. 三項演算子の形を ESLint のルールで決める（Prettier の形から組み直す）。
    const fixed = await fix(source);
    const formatted = await prettier.format(fixed, { ...options, filepath: file });
    const output = await fix(formatted);

    if (output === source) continue;
    changed.push(file);
    if (!check) await writeFile(file, output);
  }

  if (check) {
    for (const file of changed) console.log(file);
    if (changed.length > 0) {
      console.error(`${changed.length} 件のファイルの整形が必要です（npm run format）。`);
      process.exitCode = 1;
    }
  } else if (changed.length > 0) {
    console.log(`${changed.length} 件のファイルを整形しました。`);
  }
}

await main();
