import { Worker } from "bullmq"
import PDFium from "@hyzyla/pdfium"
import sharp from "sharp"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@obravision/db"
import { connection, type PdfConversionJobData } from "./pdf-conversion.queue"
import type { Server as SocketIOServer } from "socket.io"

// R2 client — same config as presigned URL generation
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

let ioInstance: SocketIOServer | null = null

/**
 * Inject the Socket.io instance so the worker can emit tiles-ready events.
 * Called from app.ts after Socket.io is initialized.
 */
export function setSocketIo(io: SocketIOServer) {
  ioInstance = io
}

export const pdfWorker = new Worker<PdfConversionJobData>(
  "pdf-conversion",
  async (job) => {
    const { plantaRevisaoId, r2Key, obraId } = job.data

    job.log(`Starting PDF conversion for revisao ${plantaRevisaoId}`)

    // 1. Download PDF from R2
    const { Body } = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: r2Key,
      })
    )

    if (!Body) {
      throw new Error(`Failed to download PDF from R2: ${r2Key}`)
    }

    const pdfBuffer = Buffer.from(await Body.transformToByteArray())
    job.log(`Downloaded PDF: ${pdfBuffer.byteLength} bytes`)

    // 2. Render each page to WebP with PDFium
    // scale: 2 = 144 DPI — good quality for construction plans
    const pdfium = await PDFium()
    const document = await pdfium.loadDocument(pdfBuffer)
    const pages = [...document.pages()]
    const pageCount = pages.length

    const tilesPrefix = `tiles/${plantaRevisaoId}`

    await Promise.all(
      pages.map(async (page, i) => {
        const { bitmap } = await page.render({ scale: 2 })

        const webpBuffer = await sharp(bitmap.data, {
          raw: { width: bitmap.width, height: bitmap.height, channels: 4 },
        })
          .webp({ quality: 85 })
          .toBuffer()

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: `${tilesPrefix}/page-${i + 1}.webp`,
            Body: webpBuffer,
            ContentType: "image/webp",
          })
        )

        job.log(`Uploaded tile page-${i + 1}.webp`)
      })
    )

    await document.destroy()

    // 3. Mark revision as tiles-ready in DB
    await prisma.plantaRevisao.update({
      where: { id: plantaRevisaoId },
      data: {
        tilesReady: true,
        tilesPrefix,
        pageCount,
      },
    })

    job.log(`Marked revisao ${plantaRevisaoId} as tiles-ready with ${pageCount} pages`)

    // 4. Notify obra room via Socket.io (if available)
    if (ioInstance) {
      ioInstance.to(`obra:${obraId}`).emit("tiles-ready", { plantaRevisaoId })
    }
  },
  { connection, concurrency: 2 }
)

pdfWorker.on("completed", (job) => {
  console.log(`[pdf-conversion] Job ${job.id} completed for revisao ${job.data.plantaRevisaoId}`)
})

pdfWorker.on("failed", (job, err) => {
  console.error(`[pdf-conversion] Job ${job?.id} failed:`, err)
})
