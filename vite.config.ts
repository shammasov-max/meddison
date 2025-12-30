import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { youwareVitePlugin } from "@youware/vite-plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [youwareVitePlugin(), react()],
  // No server config needed - our custom server handles everything
  // including API routes, static files, and Vite middleware
  build: {
    sourcemap: true,
  },
});
