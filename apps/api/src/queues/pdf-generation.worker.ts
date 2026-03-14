import { Worker } from "bullmq"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import React from "react"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@projetapro/db"
import { connection, type PdfGenerationJobData } from "./pdf-generation.queue"
import { PropostaComercial } from "../pdf-templates/PropostaComercial"
import type { PropostaComercialData } from "../pdf-templates/PropostaComercial"
import { PedidoCompra } from "../pdf-templates/PedidoCompra"
import type { PedidoCompraData } from "../pdf-templates/PedidoCompra"
import { BoletimMedicao } from "../pdf-templates/BoletimMedicao"
import type { BoletimMedicaoData } from "../pdf-templates/BoletimMedicao"
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

// ---- Pedido Compra handler ----

async function generatePedidoCompra(entityId: string, obraId: string, tenantId: string) {
  // Fetch pedido with items, fornecedor, and obra
  const pedido = await prisma.compraPedido.findUnique({
    where: { id: entityId },
    include: {
      obra: {
        include: { empresa: true },
      },
      fornecedor: true,
      itens: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!pedido) throw new Error(`CompraPedido ${entityId} not found`)

  const obra = pedido.obra
  const empresa = obra.empresa
  const fornecedor = pedido.fornecedor

  // Build data for template
  const itens = pedido.itens.map((item) => ({
    id: item.id,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: parseFloat(String(item.quantidade)),
    precoUnitario: parseFloat(String(item.precoUnitario)),
  }))

  const totalEstimado = itens.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0)

  const data: PedidoCompraData = {
    empresaNome: empresa.nome,
    obraNome: obra.nome,
    pedidoId: pedido.id,
    numeroPedido: pedido.id.slice(-8).toUpperCase(),
    dataGeracao: format(new Date(), "dd/MM/yyyy"),
    fornecedorNome: fornecedor.nome,
    fornecedorCnpj: fornecedor.cnpj,
    fornecedorContato: fornecedor.contato,
    fornecedorEmail: fornecedor.email,
    fornecedorTelefone: fornecedor.telefone,
    itens,
    totalEstimado,
    observacoes: pedido.observacoes,
  }

  // Render PDF
  const element = React.createElement(PedidoCompra, { data }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  const pdfBuffer = await renderToBuffer(element)

  // Upload to R2
  const r2Key = `pdfs/${tenantId}/pedido-compra/${entityId}-${Date.now()}.pdf`
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    })
  )

  // Update CompraPedido with pdfR2Key
  await prisma.compraPedido.update({
    where: { id: entityId },
    data: { pdfR2Key: r2Key },
  })

  return { r2Key, obraId }
}

// ---- Boletim Medicao handler ----

async function generateBoletimMedicao(entityId: string, obraId: string, tenantId: string) {
  // Try to find as MedicaoContrato first (it has pdfR2Key and empreiteiroId)
  const medicaoContrato = await prisma.medicaoContrato.findUnique({
    where: { id: entityId },
    include: {
      obra: { include: { empresa: true } },
      itens: { orderBy: { createdAt: "asc" } },
    },
  })

  if (medicaoContrato) {
    const obra = medicaoContrato.obra
    const empresa = obra.empresa

    // Fetch prior periods for acumulado
    const priorMedicoes = await prisma.medicaoContrato.findMany({
      where: {
        obraId: medicaoContrato.obraId,
        empreiteiroId: medicaoContrato.empreiteiroId,
        periodo: { lt: medicaoContrato.periodo },
      },
      include: { itens: true },
      orderBy: { periodo: "asc" },
    })

    let totalAcumuladoAnterior = 0
    for (const prior of priorMedicoes) {
      for (const item of prior.itens) {
        totalAcumuladoAnterior += parseFloat(String(item.quantidade)) * parseFloat(String(item.valorUnitario))
      }
    }

    const itensContrato = medicaoContrato.itens.map((item) => {
      const qtd = parseFloat(String(item.quantidade))
      const val = parseFloat(String(item.valorUnitario))
      const valorExecutado = qtd * val
      return {
        id: item.id,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: qtd,
        valorUnitario: val,
        valorExecutado,
        acumulado: parseFloat(String(item.acumulado)) + valorExecutado,
      }
    })

    const totalPeriodo = itensContrato.reduce((s, i) => s + i.valorExecutado, 0)

    const data: BoletimMedicaoData = {
      empresaNome: empresa.nome,
      obraNome: obra.nome,
      periodo: medicaoContrato.periodo,
      tipo: "Contrato",
      dataGeracao: format(new Date(), "dd/MM/yyyy"),
      empreiteiroNome: medicaoContrato.empreiteiroId,
      empreiteiroCnpj: medicaoContrato.contrato,
      itensContrato,
      totalPeriodo,
      totalAcumuladoAnterior,
      totalAcumulado: totalAcumuladoAnterior + totalPeriodo,
      status: medicaoContrato.status,
      aprovadoPor: medicaoContrato.aprovadoPor,
      aprovadoEm: medicaoContrato.aprovadoEm
        ? format(medicaoContrato.aprovadoEm, "dd/MM/yyyy HH:mm")
        : null,
    }

    const element = React.createElement(BoletimMedicao, { data }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    const pdfBuffer = await renderToBuffer(element)

    const r2Key = `pdfs/${tenantId}/boletim-contrato/${entityId}-${Date.now()}.pdf`
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: r2Key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    )

    await prisma.medicaoContrato.update({
      where: { id: entityId },
      data: { pdfR2Key: r2Key },
    })

    return { r2Key, obraId }
  }

  // Otherwise try as MedicaoFisica
  const medicaoFisica = await prisma.medicaoFisica.findUnique({
    where: { id: entityId },
    include: {
      obra: { include: { empresa: true } },
      itens: {
        include: {
          orcamentoItem: {
            select: { descricao: true, unidade: true, quantidade: true, custoUnitario: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!medicaoFisica) throw new Error(`Medicao ${entityId} not found as fisica or contrato`)

  const obra = medicaoFisica.obra
  const empresa = obra.empresa

  let sumValor = 0
  let sumExecutado = 0
  const itensFisica = medicaoFisica.itens.map((item) => {
    const qtd = parseFloat(String(item.orcamentoItem.quantidade))
    const custo = parseFloat(String(item.orcamentoItem.custoUnitario))
    const pct = parseFloat(String(item.percentualMedido))
    const valorTotal = qtd * custo
    const valorExecutado = valorTotal * (pct / 100)
    sumValor += valorTotal
    sumExecutado += valorExecutado
    return {
      id: item.id,
      descricao: item.orcamentoItem.descricao,
      unidade: item.orcamentoItem.unidade,
      quantidadeOrcada: qtd,
      custoUnitario: custo,
      percentualExecutado: pct,
      valorExecutado,
    }
  })

  const progressoGeral = sumValor > 0 ? parseFloat(((sumExecutado / sumValor) * 100).toFixed(1)) : 0

  const data: BoletimMedicaoData = {
    empresaNome: empresa.nome,
    obraNome: obra.nome,
    periodo: medicaoFisica.periodo,
    tipo: "Fisica",
    dataGeracao: format(new Date(), "dd/MM/yyyy"),
    progressoGeral,
    itensFisica,
    status: medicaoFisica.status,
    aprovadoPor: medicaoFisica.aprovadoPor,
    aprovadoEm: medicaoFisica.aprovadoEm
      ? format(medicaoFisica.aprovadoEm, "dd/MM/yyyy HH:mm")
      : null,
  }

  const element = React.createElement(BoletimMedicao, { data }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  const pdfBuffer = await renderToBuffer(element)

  // MedicaoFisica has no pdfR2Key field — upload to R2 but return key for socket notification only
  const r2Key = `pdfs/${tenantId}/boletim-fisica/${entityId}-${Date.now()}.pdf`
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    })
  )

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
      case "pedido-compra": {
        const result = await generatePedidoCompra(entityId, obraId, tenantId)
        r2Key = result.r2Key
        break
      }
      case "boletim-medicao": {
        const result = await generateBoletimMedicao(entityId, obraId, tenantId)
        r2Key = result.r2Key
        break
      }
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
