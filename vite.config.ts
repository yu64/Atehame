import UnoCSS from "@unocss/vite";
import path from "path";
import { fileURLToPath } from "url";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(__dirname, "src"),
  // 公開先のパス（GitHub Pages では "/リポジトリ名"）。公開のワークフローが渡す。手元では "/"。
  base: process.env.BASE_PATH || "/",
  plugins: [UnoCSS(), tsconfigPaths(), vike()],
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    // Worker の中だけで使う依存は起動時の調査で見つからず、初めて使ったときに
    // 最適化がやり直されてページが再読み込みされるため、最初から含めておく。
    include: ["comlink", "@jitl/quickjs-singlefile-cjs-release-sync", "quickjs-emscripten-core"],
  },
});
