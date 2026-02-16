import { defineConfig } from "vite";

export default defineConfig({
    plugins: [],
    root: "src/client", // your frontend source folder
    build: {
        outDir: "../../dist/client",
        rollupOptions: {
            input: {
                initiative: "src/client/initiative sender.html",
                admin: "src/client/admin.html",
            }
        },
        emptyOutDir: true,
        target: "esnext",
    },
    server: {
        port: 5173, // dev server port
    },
});
