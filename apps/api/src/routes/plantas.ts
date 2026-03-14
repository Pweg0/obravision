import type { FastifyInstance } from "fastify"
import { pdfConversionQueue } from "../queues/pdf-conversion.queue"

interface EnqueueConversionBody {
  plantaRevisaoId: string
  r2Key: string
  obraId: string
}

export async function plantasRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: EnqueueConversionBody }>(
    "/api/plantas/enqueue-conversion",
    {
      schema: {
        body: {
          type: "object",
          required: ["plantaRevisaoId", "r2Key", "obraId"],
          properties: {
            plantaRevisaoId: { type: "string" },
            r2Key: { type: "string" },
            obraId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { plantaRevisaoId, r2Key, obraId } = request.body

      const job = await pdfConversionQueue.add(
        "convert-pdf" as any,
        { plantaRevisaoId, r2Key, obraId },
        { jobId: `convert-${plantaRevisaoId}` } // idempotent — duplicate calls won't re-add
      )

      return reply.code(202).send({
        jobId: job.id,
        message: "PDF conversion queued",
        plantaRevisaoId,
      })
    }
  )
}
