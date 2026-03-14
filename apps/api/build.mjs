import { build } from "esbuild"

await build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  outfile: "dist/app.mjs",
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: true,
  external: [
    // Native modules and large packages that should remain external
    "sharp",
    "@hyzyla/pdfium",
    "ioredis",
    "bullmq",
    "@prisma/client",
    "socket.io",
    "@fastify/cors",
    "fastify",
    "fastify-plugin",
    "@aws-sdk/*",
    "date-fns",
  ],
  banner: {
    js: `
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
    `.trim(),
  },
})

console.log("API built successfully → dist/app.mjs")
