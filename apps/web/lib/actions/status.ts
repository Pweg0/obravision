"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { statusSchema } from "@/lib/validations/obra"

async function getTenantContext() {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return null
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return null

  return { session, empresa, tenantClient: createTenantClient(empresa.tenantId) }
}

export async function listStatuses() {
  const ctx = await getTenantContext()
  if (!ctx) return []

  const statuses = await ctx.tenantClient.obraStatus.findMany({
    where: { empresaId: ctx.empresa.id },
    orderBy: { id: "asc" },
  })

  return statuses
}

export async function createStatus(formData: FormData) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  if (ctx.session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem criar status" }
  }

  const rawData = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
  }

  const result = statusSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const status = await ctx.tenantClient.obraStatus.create({
    data: {
      tenantId: ctx.empresa.tenantId,
      name: result.data.name,
      color: result.data.color,
      empresaId: ctx.empresa.id,
    },
  })

  revalidatePath("/dashboard/obras")
  return { success: true, status }
}

export async function updateStatus(id: string, formData: FormData) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  if (ctx.session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem editar status" }
  }

  const rawData = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
  }

  const result = statusSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const status = await ctx.tenantClient.obraStatus.update({
    where: { id },
    data: {
      name: result.data.name,
      color: result.data.color,
    },
  })

  revalidatePath("/dashboard/obras")
  return { success: true, status }
}

export async function deleteStatus(id: string) {
  const ctx = await getTenantContext()
  if (!ctx) return { error: "Nao autenticado" }

  if (ctx.session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem excluir status" }
  }

  // Check if any obras use this status
  const obrasCount = await ctx.tenantClient.obra.count({
    where: { statusId: id },
  })

  if (obrasCount > 0) {
    return { error: `Este status esta sendo usado por ${obrasCount} obra(s). Remova o status das obras antes de excluir.` }
  }

  await ctx.tenantClient.obraStatus.delete({ where: { id } })

  revalidatePath("/dashboard/obras")
  return { success: true }
}
