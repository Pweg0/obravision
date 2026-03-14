import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@obravision/db", "@obravision/types"],
  webpack: (config) => {
    config.resolve.alias.canvas = false
    config.resolve.alias["@svar-ui/react-gantt"] = require.resolve("@svar-ui/react-gantt").replace(/index\.cjs$/, "index.es.js")
    return config
  },
}

export default nextConfig
