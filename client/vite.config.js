import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: import.meta.dirname,  // always client/, no matter where vite is invoked from
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",   // relative to root (client/), outputs to project root /dist
    emptyOutDir: true,
  },
});
