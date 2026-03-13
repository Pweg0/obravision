import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@obravision/db", "@obravision/types"],
}

export default nextConfig
