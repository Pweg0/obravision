"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import { auth } from "@/lib/auth"
import { createEtapaSchema, createItemSchema, updateBdiSchema } from "@/lib/validations/orcamento"

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
    return { error: "Permissao negada: apenas ADMIN e ENGENHEIRO podem gerenciar o orcamento" }
  }
  return null
}

// ---- searchSinapi ----

/**
 * Full-text search for SINAPI composicoes using tsvector.
 * Returns empty array for empty query.
 * Ordered by ts_rank descending — most relevant first.
 */
export async function searchSinapi(query: string, estado: string, referencia?: string) {
  if (!query.trim()) return []

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      codigo: string
      descricao: string
      unidade: string
      custoUnitario: string
      estado: string
    }>
  >(
    `SELECT id, codigo, descricao, unidade, "custoUnitario"::text, estado
     FROM "SinapiComposicao"
     WHERE estado = $1
       AND "searchVec" @@ plainto_tsquery('portuguese', $2)
       ${referencia ? `AND referencia = '${referencia.replace(/'/g, "''")}'` : ""}
     ORDER BY ts_rank("searchVec", plainto_tsquery('portuguese', $2)) DESC
     LIMIT 20`,
    estado,
    query.trim()
  )

  return results.map((r) => ({
    ...r,
    custoUnitario: parseFloat(r.custoUnitario),
  }))
}

// ---- createOrcamento ----

/**
 * Creates a new Orcamento for an obra with default BDI 0.
 * Each obra can have only one Orcamento (enforced by @unique on obraId).
 */
export async function createOrcamento(obraId: string) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const orcamento = await tenantClient.orcamento.create({
    data: {
      tenantId: empresa.tenantId,
      obraId,
      bdi: 0,
    },
  })

  revalidatePath(`/dashboard/obras/${obraId}/orcamento`)

  return { success: true, orcamento }
}

// ---- createEtapa ----

export async function createEtapa(input: { orcamentoId: string; nome: string; ordem: number }) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createEtapaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const etapa = await tenantClient.orcamentoEtapa.create({
    data: {
      tenantId: empresa.tenantId,
      orcamentoId: result.data.orcamentoId,
      nome: result.data.nome,
      ordem: result.data.ordem,
    },
  })

  return { success: true, etapa }
}

// ---- deleteEtapa ----

/**
 * Deletes an etapa. Refuses if it has items (same pattern as cronograma deleteEtapa).
 */
export async function deleteEtapa(etapaId: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const etapa = await tenantClient.orcamentoEtapa.findUnique({
    where: { id: etapaId },
    include: { orcamento: { select: { obraId: true } } },
  })

  if (!etapa) return { error: "Etapa nao encontrada" }

  const itemCount = await tenantClient.orcamentoItem.count({
    where: { etapaId },
  })

  if (itemCount > 0) {
    return { error: "Nao e possivel excluir uma etapa que possui itens" }
  }

  await tenantClient.orcamentoEtapa.delete({ where: { id: etapaId } })

  const obraId = etapa.orcamento?.obraId
  if (obraId) revalidatePath(`/dashboard/obras/${obraId}/orcamento`)

  return { success: true }
}

// ---- createItem ----

export async function createItem(input: {
  etapaId: string
  descricao: string
  unidade: string
  quantidade: number
  custoUnitario: number
  sinapiCodigo?: string
}) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createItemSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const item = await tenantClient.orcamentoItem.create({
    data: {
      tenantId: empresa.tenantId,
      etapaId: result.data.etapaId,
      descricao: result.data.descricao,
      unidade: result.data.unidade,
      quantidade: result.data.quantidade,
      custoUnitario: result.data.custoUnitario,
      sinapiCodigo: result.data.sinapiCodigo ?? null,
    },
  })

  return { success: true, item }
}

// ---- updateItem ----

export async function updateItem(
  itemId: string,
  input: {
    descricao?: string
    unidade?: string
    quantidade?: number
    custoUnitario?: number
    sinapiCodigo?: string
  }
) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const item = await tenantClient.orcamentoItem.update({
    where: { id: itemId },
    data: input,
  })

  return { success: true, item }
}

// ---- deleteItem ----

export async function deleteItem(itemId: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  await tenantClient.orcamentoItem.delete({ where: { id: itemId } })

  return { success: true }
}

// ---- updateBdi ----

/**
 * Updates BDI percentage for an Orcamento.
 * BDI is stored as Decimal(5,2); Venda view is calculated at render time.
 */
export async function updateBdi(orcamentoId: string, bdi: number) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = updateBdiSchema.safeParse({ orcamentoId, bdi })
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const orcamento = await tenantClient.orcamento.update({
    where: { id: orcamentoId },
    data: { bdi: result.data.bdi },
  })

  return { success: true, orcamento }
}

// ---- getOrcamento ----

/**
 * Returns the Orcamento for an obra with all etapas and items ordered by etapa.ordem.
 * Returns null if no orcamento exists yet.
 */
export async function getOrcamento(obraId: string) {
  const { tenantClient } = await getTenantContext()

  const orcamento = await tenantClient.orcamento.findUnique({
    where: { obraId },
    include: {
      etapas: {
        orderBy: { ordem: "asc" },
        include: {
          itens: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  return orcamento
}

// ---- importFromSheet ----

/**
 * Parses an XLSX/CSV file from FormData and bulk creates OrcamentoItem rows.
 * Expects columns: Descricao, Unidade, Quantidade, Custo Unitario.
 * etapaId must be provided in FormData.
 */
export async function importFromSheet(formData: FormData) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const file = formData.get("file")
  const etapaId = formData.get("etapaId")

  if (!file || !(file instanceof Blob)) {
    return { error: "Arquivo nao encontrado" }
  }

  if (!etapaId || typeof etapaId !== "string") {
    return { error: "etapaId e obrigatorio" }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const XLSX = await import("xlsx")
  const wb = XLSX.read(buffer, { type: "buffer" })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { error: "Planilha vazia" }

  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

  if (rows.length === 0) return { error: "Nenhuma linha encontrada na planilha" }

  const items: Array<{
    tenantId: string
    etapaId: string
    descricao: string
    unidade: string
    quantidade: number
    custoUnitario: number
    sinapiCodigo: null
  }> = []

  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed, +1 for header

    const descricao = String(row["Descricao"] ?? row["descricao"] ?? "")
    const unidade = String(row["Unidade"] ?? row["unidade"] ?? "")
    const quantidade = Number(row["Quantidade"] ?? row["quantidade"] ?? 0)
    const custoUnitario = Number(
      row["Custo Unitario"] ?? row["custoUnitario"] ?? row["Custo_Unitario"] ?? 0
    )

    if (!descricao || !unidade || quantidade <= 0 || custoUnitario < 0) {
      errors.push(`Linha ${rowNum}: dados invalidos (descricao="${descricao}", unidade="${unidade}", quantidade=${quantidade}, custoUnitario=${custoUnitario})`)
      continue
    }

    items.push({
      tenantId: empresa.tenantId,
      etapaId,
      descricao,
      unidade,
      quantidade,
      custoUnitario,
      sinapiCodigo: null,
    })
  }

  if (items.length === 0) {
    return { error: `Nenhum item valido encontrado. Erros: ${errors.slice(0, 3).join("; ")}` }
  }

  const result = await tenantClient.orcamentoItem.createMany({ data: items })

  return {
    success: true,
    count: result.count,
    errors: errors.length > 0 ? errors : undefined,
  }
}
