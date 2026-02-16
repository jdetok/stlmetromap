import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  define: {
    // Prevent "process is not defined" in browser bundles
        "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    },
    build: {
    // Build your TS entry directly (no index.html needed)
    cssCodeSplit: false,
    lib: {
      entry: "www/src/main.ts",
      name: "StlMetroMap",
      formats: ["es"],         // classic <script> compatible output
      fileName: () => "main.js", // no hashing; keep your existing /js/main.js
    },
    outDir: "www/js",
    emptyOutDir: false,          // don’t blow away www/js if you have other stuff
    sourcemap: true,
    rollupOptions: {
      // Avoid code-splitting; you want exactly one file
      output: {
        inlineDynamicImports: true,
      },
    },
  },
}));
