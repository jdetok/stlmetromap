import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  define: {
        "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
  },
      optimizeDeps: {
      include: [
        "@arcgis/core/config",
        "@arcgis/core/Map",
        "@arcgis/core/views/MapView",
        "@arcgis/core/Graphic",
        "@arcgis/core/geometry/Point",
        "@arcgis/core/symbols/SimpleMarkerSymbol",
        "@arcgis/map-components/components/arcgis-legend",
        "@arcgis/map-components/components/arcgis-expand",
      ],
    },
    build: {
    // Build your TS entry directly (no index.html needed)
    cssCodeSplit: false,
    lib: {
      entry: "www/src/main.ts",
      name: "StlMetroMap",
      formats: ["es"],
      fileName: () => "main.js", 
    },
    outDir: "www/js",
    emptyOutDir: false,          
    sourcemap: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
      },
  },
}));
