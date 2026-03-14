import { Queue } from "bullmq"
import IORedis from "ioredis"

// BullMQ requires maxRetriesPerRequest: null — see RESEARCH.md Pitfall 5
export const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
})

export type PdfType = "proposta" | "pedido-compra" | "boletim-medicao"

export interface PdfGenerationJobData {
  type: PdfType
  entityId: string // orcamentoId | comraPedidoId | medicaoId
  obraId: string
  tenantId: string
}

export const pdfGenerationQueue = new Queue<PdfGenerationJobData>("pdf-generation", {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

/**
 * Enqueues a PDF generation job.
 */
export async function addPdfJob(data: PdfGenerationJobData) {
  return pdfGenerationQueue.add(`${data.type}:${data.entityId}`, data)
}
