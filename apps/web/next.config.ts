import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  transpilePackages: ["@obravision/db", "@obravision/types"],
  webpack: (config) => {
    config.resolve.alias.canvas = false
    // @svar-ui/react-gantt has broken exports (points to index.cjs.js but file is index.cjs)
    // Resolve to the ESM entry manually
    const ganttEsm = path.resolve(__dirname, "node_modules/@svar-ui/react-gantt/dist/index.es.js")
    config.resolve.alias["@svar-ui/react-gantt"] = ganttEsm
    return config
  },
}

export default nextConfig
