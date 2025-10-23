import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const packageRoot = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  test: {
    root: packageRoot,
    include: ["tests/**/*.spec.ts"],
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: resolve(packageRoot, "../../coverage/detector"),
      all: true,
      include: ["src/**/*.ts"],
      exclude: [
        "src/node.ts",
        "../worker/**",
        "**/__tests__/**"
      ]
    }
  }
});
