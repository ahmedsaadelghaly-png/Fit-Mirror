import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/**", "tests/**", ".next/**", "*.config.*"],
    },
  },
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./app"),
      "@/features": path.resolve(__dirname, "./features"),
      "@/shared": path.resolve(__dirname, "./shared"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/hooks": path.resolve(__dirname, "./hooks"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/api": path.resolve(__dirname, "./api"),
      "@/assets": path.resolve(__dirname, "./assets"),
      "@/styles": path.resolve(__dirname, "./styles"),
      "@/types": path.resolve(__dirname, "./types"),
      "@/config": path.resolve(__dirname, "./config"),
      "@/providers": path.resolve(__dirname, "./providers"),
      "@/layouts": path.resolve(__dirname, "./layouts"),
      "@/middleware": path.resolve(__dirname, "./middleware"),
      "@/tests": path.resolve(__dirname, "./tests"),
    },
  },
});
