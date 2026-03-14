import { Queue } from "bullmq"
import IORedis from "ioredis"

// BullMQ requires maxRetriesPerRequest: null — see RESEARCH.md Pitfall 5
export const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
})

export interface PdfConversionJobData {
  plantaRevisaoId: string
  r2Key: string // source PDF key in R2
  obraId: string
  pageCount?: number
}

export const pdfConversionQueue = new Queue<PdfConversionJobData>("pdf-conversion", {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})
