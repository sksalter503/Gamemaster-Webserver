import { defineConfig } from "vite";

export default defineConfig({
    plugins: [],
    root: "src/client", // your frontend source folder
    build: {
        outDir: "dist/client",
        emptyOutDir: true,
        target: "esnext",
    },
    server: {
        port: 5173, // dev server port
    },
});
