import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@obravision/db", "@obravision/types", "@svar-ui/react-gantt"],
  webpack: (config) => {
    // Required for react-pdf v9 + pdfjs-dist — avoids canvas Node.js build errors
    // See: RESEARCH.md Pitfall 2
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
