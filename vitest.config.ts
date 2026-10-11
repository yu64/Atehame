import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// アプリの vite.config.ts（Vike・UnoCSS）とは分け、単体テストに必要な設定だけを持つ。
export default defineConfig({
  resolve: {
    alias: { "@src": path.resolve(__dirname, "src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
