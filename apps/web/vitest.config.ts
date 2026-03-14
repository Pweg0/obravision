import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@projetapro/db/rls-client": path.resolve(__dirname, "../../packages/db/src/rls-client.ts"),
      "@projetapro/db": path.resolve(__dirname, "../../packages/db/src/index.ts"),
      "@projetapro/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
})
