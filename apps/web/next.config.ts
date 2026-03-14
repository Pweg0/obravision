import type { NextConfig } from "next"
import path from "path"
import fs from "fs"

const nextConfig: NextConfig = {
  transpilePackages: ["@projetapro/db", "@projetapro/types"],
  webpack: (config) => {
    config.resolve.alias.canvas = false

    // @svar-ui/react-gantt has broken exports (points to index.cjs.js but file is index.cjs)
    // Resolve to the ESM entry manually, and also resolve its nested @svar-ui/* dependencies
    // so that Willow theme and other sub-packages are found by webpack.
    const ganttPaths = [
      path.join(process.cwd(), "node_modules/@svar-ui/react-gantt"),
      path.resolve(__dirname, "node_modules/@svar-ui/react-gantt"),
      path.resolve(process.cwd(), "../../node_modules/@svar-ui/react-gantt"),
    ]
    const ganttDir = ganttPaths.find((p) => fs.existsSync(path.join(p, "dist/index.es.js")))
    if (ganttDir) {
      // Resolve the real path (follows pnpm symlinks) so we find the correct node_modules
      const realGanttDir = fs.realpathSync(ganttDir)
      config.resolve.alias["@svar-ui/react-gantt$"] = path.join(realGanttDir, "dist/index.es.js")
      // Also alias the all.css sub-export for the Willow theme styles
      config.resolve.alias["@svar-ui/react-gantt/all.css"] = path.join(realGanttDir, "dist-full/index.css")

      // In pnpm, sibling @svar-ui packages (react-core, lib-dom, etc.) live in:
      // .pnpm/@svar-ui+react-gantt@x.x.x/node_modules/
      // Add that directory to webpack resolve.modules so imports resolve correctly.
      const pnpmNodeModules = path.resolve(realGanttDir, "../")
      if (fs.existsSync(path.join(pnpmNodeModules, "@svar-ui"))) {
        config.resolve.modules = config.resolve.modules || []
        config.resolve.modules.push(pnpmNodeModules)
      }
    }

    return config
  },
}

export default nextConfig
