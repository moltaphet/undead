import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Live run that writes src/data/examples/*.json. See scripts/snapshot-examples.test.ts. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["scripts/snapshot-examples.test.ts"], testTimeout: 600_000 },
});
