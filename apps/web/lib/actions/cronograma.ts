"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"

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
    return { error: "Permissao negada: apenas ADMIN e ENGENHEIRO podem gerenciar o cronograma" }
  }
  return null
}

// ---- Zod Schemas ----

const createEtapaSchema = z.object({
  obraId: z.string().min(1, "obraId e obrigatorio"),
  nome: z.string().min(1, "Nome da etapa e obrigatorio"),
  ordem: z.number().int().min(0, "Ordem deve ser um numero inteiro nao-negativo"),
  climaSensivel: z.boolean().optional().default(false),
})

const updateEtapaSchema = z.object({
  nome: z.string().min(1).optional(),
  ordem: z.number().int().min(0).optional(),
  climaSensivel: z.boolean().optional(),
})

const createTarefaSchema = z
  .object({
    etapaId: z.string().min(1, "etapaId e obrigatorio"),
    obraId: z.string().min(1, "obraId e obrigatorio"),
    nome: z.string().min(1, "Nome da tarefa e obrigatorio"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    responsavelId: z.string().optional(),
    climaSensivel: z.boolean().nullable().optional(),
    status: z
      .enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "ATRASADA"])
      .optional()
      .default("PENDENTE"),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "endDate deve ser igual ou posterior a startDate",
    path: ["endDate"],
  })

const updateTarefaSchema = z.object({
  nome: z.string().min(1).optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "ATRASADA"]).optional(),
  responsavelId: z.string().nullable().optional(),
  climaSensivel: z.boolean().nullable().optional(),
  progressoReal: z.number().int().min(0).max(100).optional(),
})

const updateTarefaDatesSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "endDate deve ser igual ou posterior a startDate",
    path: ["endDate"],
  })

// ---- Etapa Actions ----

export async function createEtapa(input: {
  obraId: string
  nome: string
  ordem: number
  climaSensivel?: boolean
}) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createEtapaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const etapa = await tenantClient.etapa.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      nome: data.nome,
      ordem: data.ordem,
      climaSensivel: data.climaSensivel ?? false,
    },
  })

  revalidatePath(`/dashboard/obras/${data.obraId}/cronograma`)
  return { success: true, etapa }
}

export async function updateEtapa(
  id: string,
  input: {
    nome?: string
    ordem?: number
    climaSensivel?: boolean
  }
) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = updateEtapaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const etapa = await tenantClient.etapa.update({
    where: { id },
    data: result.data,
  })

  revalidatePath(`/dashboard/obras/${etapa.obraId}/cronograma`)
  return { success: true, etapa }
}

export async function deleteEtapa(id: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  // Check for child tarefas
  const tarefaCount = await tenantClient.tarefa.count({
    where: { etapaId: id },
  })

  if (tarefaCount > 0) {
    return {
      error: `Nao e possivel excluir a etapa: possui ${tarefaCount} tarefa(s) vinculada(s). Remova as tarefas primeiro.`,
    }
  }

  const etapa = await tenantClient.etapa.findUnique({ where: { id } })
  await tenantClient.etapa.delete({ where: { id } })

  if (etapa) {
    revalidatePath(`/dashboard/obras/${etapa.obraId}/cronograma`)
  }

  return { success: true }
}

// ---- Tarefa Actions ----

export async function createTarefa(input: {
  etapaId: string
  obraId: string
  nome: string
  startDate: Date
  endDate: Date
  responsavelId?: string
  climaSensivel?: boolean | null
  status?: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA"
}) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createTarefaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const tarefa = await tenantClient.tarefa.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      etapaId: data.etapaId,
      nome: data.nome,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      responsavelId: data.responsavelId ?? null,
      climaSensivel: data.climaSensivel ?? null,
    },
  })

  revalidatePath(`/dashboard/obras/${data.obraId}/cronograma`)
  return { success: true, tarefa }
}

export async function updateTarefa(
  id: string,
  input: {
    nome?: string
    status?: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA"
    responsavelId?: string | null
    climaSensivel?: boolean | null
    progressoReal?: number
  }
) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = updateTarefaSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const tarefa = await tenantClient.tarefa.update({
    where: { id },
    data: result.data,
  })

  revalidatePath(`/dashboard/obras/${tarefa.obraId}/cronograma`)
  return { success: true, tarefa }
}

export async function updateTarefaDates(
  id: string,
  input: {
    startDate: Date
    endDate: Date
  }
) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = updateTarefaDatesSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const tarefa = await tenantClient.tarefa.update({
    where: { id },
    data: {
      startDate: result.data.startDate,
      endDate: result.data.endDate,
    },
  })

  revalidatePath(`/dashboard/obras/${tarefa.obraId}/cronograma`)
  return { success: true, tarefa }
}

export async function deleteTarefa(id: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const tarefa = await tenantClient.tarefa.findUnique({ where: { id } })
  await tenantClient.tarefa.delete({ where: { id } })

  if (tarefa) {
    revalidatePath(`/dashboard/obras/${tarefa.obraId}/cronograma`)
  }

  return { success: true }
}

// ---- Query Actions ----

export async function listCronograma(obraId: string) {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    redirect("/login")
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return []

  const tenantClient = createTenantClient(empresa.tenantId)

  const etapas = await tenantClient.etapa.findMany({
    where: { obraId },
    include: {
      tarefas: {
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { ordem: "asc" },
  })

  return etapas
}
