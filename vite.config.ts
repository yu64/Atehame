import { defineConfig } from 'vite'
import UnoCSS from '@unocss/vite'
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from 'url'
import path from 'path'
import vike from "vike/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, "src"),
  base: (process.env.IC ? "/Atehame" : "/"),
  plugins: [
    UnoCSS(), 
    tsconfigPaths(),
    vike()
  ],
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
