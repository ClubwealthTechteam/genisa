import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(root, "src"),
      // "server-only" refuses to load outside Next's server build; tests run server code directly.
      "server-only": path.join(root, "test/empty-module.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "db/**/*.test.ts"],
    environment: "node",
  },
});
