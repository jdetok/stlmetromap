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
        cssCodeSplit: false,
        lib: {
            entry: "www/src/main.ts",
            name: "stlmetromap",
            formats: ["es"],
            fileName: () => "main.js",
        },
        outDir: "www/js",
        emptyOutDir: false,
        // sourcemap: true,
        rollupOptions: {
            output: {
                format: "es"
                // inlineDynamicImports: true,
            },
        },
    },
}));
