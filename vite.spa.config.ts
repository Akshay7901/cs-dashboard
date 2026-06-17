// Standalone Vite config that builds a plain SPA bundle for static hosting
// (e.g. Vercel). Bypasses TanStack Start's SSR pipeline and produces a
// classic index.html + JS entry; routes resolve client-side.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist-spa",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.spa.html"),
    },
  },
});