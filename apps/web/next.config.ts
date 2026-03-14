import type { NextConfig } from "next"
import path from "path"
import fs from "fs"

const nextConfig: NextConfig = {
  transpilePackages: ["@projetapro/db", "@projetapro/types"],
  webpack: (config) => {
    config.resolve.alias.canvas = false

    // @svar-ui/react-gantt has broken exports (points to index.cjs.js but file is index.cjs)
    // Resolve to the ESM entry manually.
    // Check multiple locations: local node_modules, hoisted (pnpm/Railway), and cwd-based.
    const candidates = [
      path.join(process.cwd(), "node_modules/@svar-ui/react-gantt/dist/index.es.js"),
      path.resolve(__dirname, "node_modules/@svar-ui/react-gantt/dist/index.es.js"),
      path.resolve(process.cwd(), "../../node_modules/@svar-ui/react-gantt/dist/index.es.js"),
    ]
    const ganttEsm = candidates.find((p) => fs.existsSync(p))
    if (ganttEsm) {
      config.resolve.alias["@svar-ui/react-gantt"] = ganttEsm
    }

    return config
  },
}

export default nextConfig
