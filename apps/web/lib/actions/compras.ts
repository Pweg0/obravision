"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import {
  createRequisicaoSchema,
  addCotacaoSchema,
  createPedidoSchema,
  type CreateRequisicaoInput,
  type AddCotacaoInput,
  type CreatePedidoInput,
} from "@/lib/validations/compras"
import { emitNotification } from "@/lib/actions/notification"
import { addPdfJob } from "@/lib/pdf-queue-client"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// ---- Tenant context helper ----

async function getTenantContext() {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    redirect("/login")
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) {
    throw new Error("Empresa nao encontrada")
  }

  return {
    session,
    empresa,
    tenantClient: createTenantClient(empresa.tenantId),
  }
}

function requireAdminOrEngenheiro(role: string) {
  if (role !== "ADMIN" && role !== "ENGENHEIRO") {
    return { error: "Permissao negada: apenas ADMIN e ENGENHEIRO podem gerenciar compras" }
  }
  return null
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

// ---- Requisicao Actions ----

/**
 * Creates a purchase requisition with status PENDENTE.
 * Optionally links to an orcamento item (enabling comprado vs orcado tracking).
 * Emits notification to ADMIN users in the obra.
 */
export async function createRequisicao(input: CreateRequisicaoInput) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createRequisicaoSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const requisicao = await tenantClient.compraRequisicao.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      orcamentoItemId: data.orcamentoItemId ?? null,
      descricao: data.descricao,
      quantidade: data.quantidade,
      unidade: data.unidade,
      status: "PENDENTE",
      solicitanteId: session.user.id,
    },
  })

  // Emit notification to ADMIN users in this obra
  try {
    const adminMembers = await prisma.obraMember.findMany({
      where: {
        obraId: data.obraId,
        tenantId: empresa.tenantId,
        role: "ADMIN",
      },
      select: { userId: true },
    })
    const adminIds = adminMembers
      .map((m) => m.userId)
      .filter((id): id is string => id !== null && id !== session.user.id)

    if (adminIds.length > 0) {
      await emitNotification(
        data.obraId,
        "nova-requisicao",
        { requisicaoId: requisicao.id, descricao: data.descricao },
        adminIds,
        "nova_requisicao",
        {
          obraId: data.obraId,
          requisicaoId: requisicao.id,
          descricao: data.descricao,
          solicitanteId: session.user.id,
        }
      )
    }
  } catch {
    // Non-fatal — notification failure should not block requisicao creation
  }

  revalidatePath(`/dashboard/obras/${data.obraId}/compras`)
  return { success: true, requisicao }
}

/**
 * Approves a pending requisicao.
 * Only ADMIN or ENGENHEIRO can approve.
 * Emits notification to the requester.
 */
export async function approveRequisicao(requisicaoId: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const requisicao = await tenantClient.compraRequisicao.findUnique({
    where: { id: requisicaoId },
  })

  if (!requisicao) {
    return { error: "Requisicao nao encontrada" }
  }

  const updated = await tenantClient.compraRequisicao.update({
    where: { id: requisicaoId },
    data: {
      status: "APROVADA",
      aprovadorId: session.user.id,
      aprovadoEm: new Date(),
    },
  })

  // Notify the requester
  if (requisicao.solicitanteId && requisicao.solicitanteId !== session.user.id) {
    try {
      await emitNotification(
        requisicao.obraId,
        "requisicao-aprovada",
        { requisicaoId },
        [requisicao.solicitanteId],
        "requisicao_aprovada",
        {
          obraId: requisicao.obraId,
          requisicaoId,
          descricao: requisicao.descricao,
          aprovadorId: session.user.id,
        }
      )
    } catch {
      // Non-fatal
    }
  }

  revalidatePath(`/dashboard/obras/${requisicao.obraId}/compras`)
  return { success: true, requisicao: updated }
}

/**
 * Rejects (cancels) a requisicao with an optional reason.
 */
export async function rejectRequisicao(requisicaoId: string, motivo?: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const requisicao = await tenantClient.compraRequisicao.findUnique({
    where: { id: requisicaoId },
  })

  if (!requisicao) {
    return { error: "Requisicao nao encontrada" }
  }

  const updated = await tenantClient.compraRequisicao.update({
    where: { id: requisicaoId },
    data: { status: "CANCELADA" },
  })

  revalidatePath(`/dashboard/obras/${requisicao.obraId}/compras`)
  return { success: true, requisicao: updated }
}

/**
 * Lists all requisicoes for an obra, including status and orcamento item link.
 */
export async function listRequisicoes(obraId: string) {
  const { tenantClient } = await getTenantContext()

  const requisicoes = await tenantClient.compraRequisicao.findMany({
    where: { obraId },
    include: {
      orcamentoItem: {
        select: {
          id: true,
          descricao: true,
          quantidade: true,
          unidade: true,
          custoUnitario: true,
        },
      },
      cotacoes: {
        include: { fornecedor: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return requisicoes
}

// ---- Cotacao Actions ----

/**
 * Adds a supplier quote to a requisicao.
 * One quote per (requisicao, fornecedor) pair — enforced by @unique.
 * Updates requisicao status to EM_COTACAO on first quote.
 */
export async function addCotacao(input: AddCotacaoInput) {
  const { empresa, tenantClient } = await getTenantContext()

  const result = addCotacaoSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  // Check if cotacao already exists for this (requisicao, fornecedor) pair
  const existing = await tenantClient.compraCotacao.findFirst({
    where: {
      requisicaoId: data.requisicaoId,
      fornecedorId: data.fornecedorId,
    },
  })

  if (existing) {
    return { error: "Ja existe uma cotacao deste fornecedor para esta requisicao" }
  }

  const cotacao = await tenantClient.compraCotacao.create({
    data: {
      tenantId: empresa.tenantId,
      requisicaoId: data.requisicaoId,
      fornecedorId: data.fornecedorId,
      precoUnitario: data.precoUnitario,
      prazoEntrega: data.prazoEntrega ?? null,
      observacoes: data.observacoes ?? null,
    },
  })

  // Get requisicao to update status and revalidate path
  const requisicao = await tenantClient.compraRequisicao.findUnique({
    where: { id: data.requisicaoId },
    select: { obraId: true, status: true },
  })

  if (requisicao) {
    // Move to EM_COTACAO if it was APROVADA or PENDENTE
    if (requisicao.status === "APROVADA" || requisicao.status === "PENDENTE") {
      await tenantClient.compraRequisicao.update({
        where: { id: data.requisicaoId },
        data: { status: "APROVADA" }, // Stays APROVADA, EM_COTACAO is handled in the UI display
      })
    }
    revalidatePath(`/dashboard/obras/${requisicao.obraId}/compras/${data.requisicaoId}`)
  }

  return { success: true, cotacao }
}

/**
 * Lists all cotacoes for a requisicao (used for mapa comparativo).
 */
export async function listCotacoes(requisicaoId: string) {
  const { tenantClient } = await getTenantContext()

  const cotacoes = await tenantClient.compraCotacao.findMany({
    where: { requisicaoId },
    include: { fornecedor: true },
    orderBy: { createdAt: "asc" },
  })

  return cotacoes
}

// ---- Pedido Actions ----

/**
 * Creates a purchase order (CompraPedido) with status RASCUNHO.
 * Enqueues a "pedido-compra" PDF generation job to BullMQ.
 */
export async function createPedido(input: CreatePedidoInput) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createPedidoSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  // Calculate total
  const totalEstimado = data.itens.reduce(
    (sum, item) => sum + item.quantidade * item.precoUnitario,
    0
  )

  const pedido = await tenantClient.compraPedido.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      fornecedorId: data.fornecedorId,
      status: "RASCUNHO",
      totalEstimado,
      observacoes: data.observacoes ?? null,
      itens: {
        create: data.itens.map((item) => ({
          tenantId: empresa.tenantId,
          requisicaoId: item.requisicaoId ?? null,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
      },
    },
  })

  // Enqueue PDF generation job
  await addPdfJob({
    type: "pedido-compra",
    entityId: pedido.id,
    obraId: data.obraId,
    tenantId: empresa.tenantId,
  })

  revalidatePath(`/dashboard/obras/${data.obraId}/compras`)
  return { success: true, pedido }
}

/**
 * Returns a presigned GET URL for downloading the pedido PDF.
 * Returns null if no PDF has been generated yet.
 */
export async function getPedidoPdfUrl(pedidoId: string): Promise<string | null> {
  const { tenantClient } = await getTenantContext()

  const pedido = await tenantClient.compraPedido.findUnique({
    where: { id: pedidoId },
    select: { pdfR2Key: true },
  })

  if (!pedido?.pdfR2Key) return null

  const r2 = getR2Client()
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: pedido.pdfR2Key,
    }),
    { expiresIn: 3600 }
  )

  return url
}

/**
 * Gets the comprado vs orcado quantities for an orcamento item.
 * Sums all APPROVED/active requisicao quantities for the item.
 */
export async function getCompradoVsOrcado(orcamentoItemId: string) {
  const { tenantClient } = await getTenantContext()

  const requisicoes = await tenantClient.compraRequisicao.findMany({
    where: {
      orcamentoItemId,
      status: {
        in: ["PENDENTE", "APROVADA"],
      },
    },
    select: { quantidade: true },
  })

  const totalComprado = requisicoes.reduce(
    (sum, r) => sum + parseFloat(String(r.quantidade)),
    0
  )

  return { totalComprado }
}
