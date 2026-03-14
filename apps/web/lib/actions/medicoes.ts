"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import {
  createMedicaoFisicaSchema,
  updateMedicaoFisicaItemSchema,
  createMedicaoContratoSchema,
  addContratoItemSchema,
  type CreateMedicaoFisicaInput,
  type UpdateMedicaoFisicaItemInput,
  type CreateMedicaoContratoInput,
  type AddContratoItemInput,
} from "@/lib/validations/medicoes"
import { calcularProgressoPonderado } from "@/lib/medicoes-utils"
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

function requireAdmin(role: string) {
  // Locked decision: only ADMIN can approve medicoes (not ENGENHEIRO)
  if (role !== "ADMIN") {
    return { error: "Permissao negada: apenas ADMIN pode aprovar medicoes" }
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

// ---- Medicao Fisica Actions ----

/**
 * Creates a MedicaoFisica with RASCUNHO status.
 * Auto-generates MedicaoFisicaItem rows for ALL OrcamentoItems in the orcamento
 * with percentualMedido = 0.
 */
export async function createMedicaoFisica(input: CreateMedicaoFisicaInput) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const result = createMedicaoFisicaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  // Create the medicao
  const medicao = await tenantClient.medicaoFisica.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      periodo: data.periodo,
      status: "RASCUNHO",
    },
  })

  // Fetch all orcamento items to auto-generate medicao items
  const orcamento = await tenantClient.orcamento.findUnique({
    where: { id: data.orcamentoId },
    include: {
      etapas: {
        include: {
          itens: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (orcamento) {
    // Flatten all items from all etapas
    const allItems = orcamento.etapas.flatMap((etapa) => etapa.itens)

    // Create MedicaoFisicaItem for each OrcamentoItem (percentualMedido = 0)
    for (const item of allItems) {
      await tenantClient.medicaoFisicaItem.create({
        data: {
          tenantId: empresa.tenantId,
          medicaoId: medicao.id,
          orcamentoItemId: item.id,
          percentualMedido: 0,
          acumulado: 0,
        },
      })
    }
  }

  revalidatePath(`/dashboard/obras/${data.obraId}/medicoes`)
  return { success: true, medicao }
}

/**
 * Updates the execution percentage for a MedicaoFisicaItem.
 * Recalculates the overall weighted progress for the medicao.
 */
export async function updateMedicaoFisicaItem(input: UpdateMedicaoFisicaItemInput) {
  const { tenantClient } = await getTenantContext()

  const result = updateMedicaoFisicaItemSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  // Update the item percentage
  const updatedItem = await tenantClient.medicaoFisicaItem.update({
    where: { id: data.medicaoFisicaItemId },
    data: { percentualMedido: data.percentualExecutado },
  })

  // Fetch all items for this medicao to recalculate weighted progress
  const allItems = await tenantClient.medicaoFisicaItem.findMany({
    where: { medicaoId: updatedItem.medicaoId },
    include: {
      orcamentoItem: {
        select: { quantidade: true, custoUnitario: true },
      },
    },
  })

  // Build inputs for calcularProgressoPonderado
  const progressoItems = allItems.map((item) => {
    const quantidade = parseFloat(String(item.orcamentoItem.quantidade))
    const custoUnitario = parseFloat(String(item.orcamentoItem.custoUnitario))
    return {
      valorTotal: quantidade * custoUnitario,
      percentualExecutado: parseFloat(String(item.percentualMedido)),
    }
  })

  const progressoGeral = calcularProgressoPonderado(progressoItems)

  revalidatePath(`/dashboard/obras`)
  return { success: true, item: updatedItem, progressoGeral }
}

/**
 * Returns a MedicaoFisica with all items including orcamentoItem details.
 */
export async function getMedicaoFisica(medicaoId: string) {
  const { tenantClient } = await getTenantContext()

  const medicao = await tenantClient.medicaoFisica.findUnique({
    where: { id: medicaoId },
    include: {
      itens: {
        include: {
          orcamentoItem: {
            select: {
              id: true,
              descricao: true,
              quantidade: true,
              custoUnitario: true,
              unidade: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!medicao) return null

  // Calculate weighted progress from items
  const progressoItems = medicao.itens.map((item) => {
    const quantidade = parseFloat(String(item.orcamentoItem.quantidade))
    const custoUnitario = parseFloat(String(item.orcamentoItem.custoUnitario))
    return {
      valorTotal: quantidade * custoUnitario,
      percentualExecutado: parseFloat(String(item.percentualMedido)),
    }
  })

  const progressoGeral = calcularProgressoPonderado(progressoItems)

  return { ...medicao, progressoGeral }
}

/**
 * Lists all MedicaoFisicas for an obra, ordered by periodo DESC.
 */
export async function listMedicoesFisicas(obraId: string) {
  const { tenantClient } = await getTenantContext()

  const medicoes = await tenantClient.medicaoFisica.findMany({
    where: { obraId },
    include: {
      itens: {
        include: {
          orcamentoItem: { select: { quantidade: true, custoUnitario: true } },
        },
      },
    },
    orderBy: { periodo: "desc" },
  })

  // Augment each medicao with computed progressoGeral
  return medicoes.map((medicao) => {
    const progressoItems = medicao.itens.map((item) => ({
      valorTotal: parseFloat(String(item.orcamentoItem.quantidade)) * parseFloat(String(item.orcamentoItem.custoUnitario)),
      percentualExecutado: parseFloat(String(item.percentualMedido)),
    }))
    return { ...medicao, progressoGeral: calcularProgressoPonderado(progressoItems) }
  })
}

// ---- Medicao Contrato Actions ----

/**
 * Creates a MedicaoContrato with RASCUNHO status.
 * empreiteiroNome stored as empreiteiroId (free-text name field in schema).
 * Optional empreiteiroCnpj stored in contrato field.
 */
export async function createMedicaoContrato(input: CreateMedicaoContratoInput) {
  const { empresa, tenantClient } = await getTenantContext()

  const result = createMedicaoContratoSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const medicao = await tenantClient.medicaoContrato.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      empreiteiroId: data.empreiteiroNome,
      contrato: data.empreiteiroCnpj ?? null,
      periodo: data.periodo,
      status: "RASCUNHO",
    },
  })

  revalidatePath(`/dashboard/obras/${data.obraId}/medicoes`)
  return { success: true, medicao }
}

/**
 * Adds an item to a MedicaoContrato.
 */
export async function addContratoItem(input: AddContratoItemInput) {
  const { empresa, tenantClient } = await getTenantContext()

  const result = addContratoItemSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const item = await tenantClient.medicaoContratoItem.create({
    data: {
      tenantId: empresa.tenantId,
      medicaoId: data.medicaoId,
      descricao: data.descricao,
      unidade: data.unidade,
      quantidade: data.quantidade,
      valorUnitario: data.valorUnitario,
      acumulado: 0,
    },
  })

  revalidatePath(`/dashboard/obras`)
  return { success: true, item }
}

/**
 * Returns a MedicaoContrato with items and cumulative totals from prior periods
 * for the same empreiteiro (same obra + empreiteiroId).
 */
export async function getMedicaoContrato(medicaoId: string) {
  const { tenantClient } = await getTenantContext()

  const medicao = await tenantClient.medicaoContrato.findUnique({
    where: { id: medicaoId },
    include: {
      itens: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!medicao) return null

  // Fetch prior period medicoes for same empreiteiro in same obra (for acumulado)
  const priorMedicoes = await tenantClient.medicaoContrato.findMany({
    where: {
      obraId: medicao.obraId,
      empreiteiroId: medicao.empreiteiroId,
      periodo: { lt: medicao.periodo },
    },
    include: {
      itens: true,
    },
    orderBy: { periodo: "asc" },
  })

  // Compute cumulative totals from prior periods
  let totalAcumuladoAnterior = 0
  for (const prior of priorMedicoes) {
    for (const item of prior.itens) {
      const qtd = parseFloat(String(item.quantidade))
      const val = parseFloat(String(item.valorUnitario))
      totalAcumuladoAnterior += qtd * val
    }
  }

  // Current period total
  const totalPeriodo = medicao.itens.reduce((sum, item) => {
    return sum + parseFloat(String(item.quantidade)) * parseFloat(String(item.valorUnitario))
  }, 0)

  return {
    ...medicao,
    totalPeriodo,
    totalAcumuladoAnterior,
    totalAcumulado: totalAcumuladoAnterior + totalPeriodo,
    priorMedicoes,
  }
}

/**
 * Lists all MedicaoContratos for an obra, ordered by periodo DESC.
 */
export async function listMedicoesContrato(obraId: string) {
  const { tenantClient } = await getTenantContext()

  const medicoes = await tenantClient.medicaoContrato.findMany({
    where: { obraId },
    include: {
      itens: true,
    },
    orderBy: { periodo: "desc" },
  })

  return medicoes.map((medicao) => {
    const total = medicao.itens.reduce(
      (sum, item) =>
        sum + parseFloat(String(item.quantidade)) * parseFloat(String(item.valorUnitario)),
      0
    )
    return { ...medicao, totalPeriodo: total }
  })
}

// ---- Approval Actions ----

/**
 * Approves a medicao (fisica or contrato).
 * ADMIN ONLY — locked decision: Admin aprova medicoes, ENGENHEIRO cannot.
 * Updates status to APROVADA, sets aprovadoPor/aprovadoEm.
 * Emits notification to the obra members.
 */
export async function approveMedicao(type: "fisica" | "contrato", medicaoId: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdmin(session.user.role)
  if (permError) return permError

  if (type === "fisica") {
    const medicao = await tenantClient.medicaoFisica.findUnique({
      where: { id: medicaoId },
    })
    if (!medicao) return { error: "Medicao nao encontrada" }

    const updated = await tenantClient.medicaoFisica.update({
      where: { id: medicaoId },
      data: {
        status: "APROVADA",
        aprovadoPor: session.user.id,
        aprovadoEm: new Date(),
      },
    })

    // Emit notification to obra members
    try {
      await emitNotification(
        medicao.obraId,
        "medicao-aprovada",
        { medicaoId, tipo: "fisica", periodo: medicao.periodo },
        [],
        "medicao_aprovada",
        { obraId: medicao.obraId, medicaoId, tipo: "fisica", periodo: medicao.periodo }
      )
    } catch {
      // Non-fatal
    }

    revalidatePath(`/dashboard/obras/${medicao.obraId}/medicoes`)
    return { success: true, medicao: updated }
  } else {
    const medicao = await tenantClient.medicaoContrato.findUnique({
      where: { id: medicaoId },
    })
    if (!medicao) return { error: "Medicao nao encontrada" }

    const updated = await tenantClient.medicaoContrato.update({
      where: { id: medicaoId },
      data: {
        status: "APROVADA",
        aprovadoPor: session.user.id,
        aprovadoEm: new Date(),
      },
    })

    try {
      await emitNotification(
        medicao.obraId,
        "medicao-aprovada",
        { medicaoId, tipo: "contrato", periodo: medicao.periodo },
        [],
        "medicao_aprovada",
        { obraId: medicao.obraId, medicaoId, tipo: "contrato", periodo: medicao.periodo }
      )
    } catch {
      // Non-fatal
    }

    revalidatePath(`/dashboard/obras/${medicao.obraId}/medicoes`)
    return { success: true, medicao: updated }
  }
}

/**
 * Rejects a medicao (fisica or contrato).
 * ADMIN ONLY.
 * Updates status to REJEITADA.
 */
export async function rejectMedicao(
  type: "fisica" | "contrato",
  medicaoId: string,
  motivo?: string
) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdmin(session.user.role)
  if (permError) return permError

  if (type === "fisica") {
    const medicao = await tenantClient.medicaoFisica.findUnique({
      where: { id: medicaoId },
    })
    if (!medicao) return { error: "Medicao nao encontrada" }

    const updated = await tenantClient.medicaoFisica.update({
      where: { id: medicaoId },
      data: { status: "REJEITADA" },
    })

    revalidatePath(`/dashboard/obras/${medicao.obraId}/medicoes`)
    return { success: true, medicao: updated }
  } else {
    const medicao = await tenantClient.medicaoContrato.findUnique({
      where: { id: medicaoId },
    })
    if (!medicao) return { error: "Medicao nao encontrada" }

    const updated = await tenantClient.medicaoContrato.update({
      where: { id: medicaoId },
      data: { status: "REJEITADA" },
    })

    revalidatePath(`/dashboard/obras/${medicao.obraId}/medicoes`)
    return { success: true, medicao: updated }
  }
}

// ---- PDF Export Actions ----

/**
 * Enqueues a "boletim-medicao" PDF job to BullMQ.
 * Returns { status: "queued" }.
 */
export async function exportBoletim(type: "fisica" | "contrato", medicaoId: string) {
  const { empresa, tenantClient } = await getTenantContext()

  let obraId: string

  if (type === "fisica") {
    const medicao = await tenantClient.medicaoFisica.findUnique({
      where: { id: medicaoId },
      select: { obraId: true },
    })
    if (!medicao) return { error: "Medicao nao encontrada" }
    obraId = medicao.obraId
  } else {
    const medicao = await tenantClient.medicaoContrato.findUnique({
      where: { id: medicaoId },
      select: { obraId: true },
    })
    if (!medicao) return { error: "Medicao nao encontrada" }
    obraId = medicao.obraId
  }

  await addPdfJob({
    type: "boletim-medicao",
    entityId: medicaoId,
    obraId,
    tenantId: empresa.tenantId,
  })

  return { status: "queued" }
}

/**
 * Returns a presigned GET URL for the boletim PDF.
 * Supports both fisica and contrato types (both have pdfR2Key field).
 * Returns null if no PDF has been generated yet.
 */
export async function getBoletimPdfUrl(
  type: "fisica" | "contrato",
  medicaoId: string
): Promise<string | null> {
  const { tenantClient } = await getTenantContext()

  const pdfR2Key =
    type === "contrato"
      ? (
          await tenantClient.medicaoContrato.findUnique({
            where: { id: medicaoId },
            select: { pdfR2Key: true },
          })
        )?.pdfR2Key
      : (
          await tenantClient.medicaoFisica.findUnique({
            where: { id: medicaoId },
            select: { pdfR2Key: true },
          })
        )?.pdfR2Key

  if (!pdfR2Key) return null

  const r2 = getR2Client()
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: pdfR2Key,
    }),
    { expiresIn: 3600 }
  )

  return url
}
