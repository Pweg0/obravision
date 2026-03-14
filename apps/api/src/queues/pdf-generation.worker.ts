import { Worker } from "bullmq"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import React from "react"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@projetapro/db"
import { connection, type PdfGenerationJobData } from "./pdf-generation.queue"
import { PropostaComercial } from "../pdf-templates/PropostaComercial"
import type { PropostaComercialData } from "../pdf-templates/PropostaComercial"
import type { Server as SocketIOServer } from "socket.io"
import { format } from "date-fns"
import type { ReactElement, JSXElementConstructor } from "react"

// R2 client — same config as pdf-conversion worker
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
 * Inject the Socket.io instance so the worker can emit pdf-ready events.
 * Called from app.ts after Socket.io is initialized.
 */
export function setPdfGenerationSocketIo(io: SocketIOServer) {
  ioInstance = io
}

// ---- Proposta handler ----

async function generateProposta(entityId: string, obraId: string, tenantId: string) {
  // Fetch orcamento with all etapas and items
  const orcamento = await prisma.orcamento.findUnique({
    where: { id: entityId },
    include: {
      obra: {
        include: { empresa: true },
      },
      etapas: {
        orderBy: { ordem: "asc" },
        include: {
          itens: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!orcamento) throw new Error(`Orcamento ${entityId} not found`)

  const bdi = parseFloat(String(orcamento.bdi))
  const obra = orcamento.obra
  const empresa = obra.empresa

  // Build data for template
  let totalCusto = 0
  const etapas = orcamento.etapas.map((etapa) => {
    let subtotalCusto = 0
    const itens = etapa.itens.map((item) => {
      const quantidade = parseFloat(String(item.quantidade))
      const custoUnitario = parseFloat(String(item.custoUnitario))
      const custoTotal = quantidade * custoUnitario
      subtotalCusto += custoTotal
      return {
        id: item.id,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade,
        custoUnitario,
        custoTotal,
      }
    })
    totalCusto += subtotalCusto
    return { id: etapa.id, nome: etapa.nome, itens, subtotalCusto }
  })

  const totalVenda = totalCusto * (1 + bdi / 100)

  const data: PropostaComercialData = {
    empresaNome: empresa.nome,
    obraNome: obra.nome,
    obraEndereco: `${obra.logradouro}, ${obra.numero} — ${obra.cidade}/${obra.estado}`,
    dataGeracao: format(new Date(), "dd/MM/yyyy"),
    bdi,
    etapas,
    totalCusto,
    totalVenda,
  }

  // Render PDF — cast through unknown to satisfy renderToBuffer's DocumentProps type
  const element = React.createElement(PropostaComercial, { data }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  const pdfBuffer = await renderToBuffer(element)

  // Upload to R2
  const r2Key = `pdfs/${tenantId}/proposta/${entityId}-${Date.now()}.pdf`
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    })
  )

  // Update Orcamento with pdfR2Key
  await prisma.orcamento.update({
    where: { id: entityId },
    data: { pdfR2Key: r2Key },
  })

  return { r2Key, obraId }
}

// ---- Worker ----

export const pdfGenerationWorker = new Worker<PdfGenerationJobData>(
  "pdf-generation",
  async (job) => {
    const { type, entityId, obraId, tenantId } = job.data

    job.log(`[pdf-generation] Starting job type=${type} entityId=${entityId}`)

    let r2Key: string

    switch (type) {
      case "proposta": {
        const result = await generateProposta(entityId, obraId, tenantId)
        r2Key = result.r2Key
        break
      }
      case "pedido-compra":
        // TODO: implement in Plan 04-03
        throw new Error("pedido-compra PDF not yet implemented")
      case "boletim-medicao":
        // TODO: implement in Plan 04-05
        throw new Error("boletim-medicao PDF not yet implemented")
      default:
        throw new Error(`Unknown PDF type: ${type}`)
    }

    job.log(`[pdf-generation] PDF uploaded to R2: ${r2Key}`)

    // Emit pdf-ready socket event to obra room
    if (ioInstance) {
      ioInstance.to(`obra:${obraId}`).emit("pdf-ready", { type, entityId, r2Key })
    }
  },
  { connection: connection as any, concurrency: 3 }
)

pdfGenerationWorker.on("completed", (job) => {
  console.log(`[pdf-generation] Job ${job.id} completed: ${job.data.type}:${job.data.entityId}`)
})

pdfGenerationWorker.on("failed", (job, err) => {
  console.error(`[pdf-generation] Job ${job?.id} failed:`, err)
})
