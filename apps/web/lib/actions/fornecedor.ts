"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import {
  createFornecedorSchema,
  updateFornecedorSchema,
  type CreateFornecedorInput,
  type UpdateFornecedorInput,
} from "@/lib/validations/compras"

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
    return { error: "Permissao negada: apenas ADMIN e ENGENHEIRO podem gerenciar fornecedores" }
  }
  return null
}

// ---- Fornecedor Actions ----

/**
 * Creates a Fornecedor scoped to the session user's empresaId.
 * Fornecedores are NOT scoped to an obra — they are reusable across all obras of the empresa.
 */
export async function createFornecedor(input: CreateFornecedorInput) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createFornecedorSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const fornecedor = await tenantClient.fornecedor.create({
    data: {
      tenantId: empresa.tenantId,
      empresaId: empresa.id,
      nome: data.nome,
      cnpj: data.cnpj ?? null,
      contato: data.contato ?? null,
      email: data.email || null,
      telefone: data.telefone ?? null,
      categorias: data.categorias,
    },
  })

  revalidatePath("/dashboard/fornecedores")
  return { success: true, fornecedor }
}

/**
 * Lists all fornecedores for the current empresa.
 */
export async function listFornecedores() {
  const { empresa, tenantClient } = await getTenantContext()

  const fornecedores = await tenantClient.fornecedor.findMany({
    where: { empresaId: empresa.id },
    orderBy: { nome: "asc" },
  })

  return fornecedores
}

/**
 * Updates a fornecedor's details.
 */
export async function updateFornecedor(id: string, input: UpdateFornecedorInput) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = updateFornecedorSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const fornecedor = await tenantClient.fornecedor.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome }),
      ...(data.cnpj !== undefined && { cnpj: data.cnpj ?? null }),
      ...(data.contato !== undefined && { contato: data.contato ?? null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.telefone !== undefined && { telefone: data.telefone ?? null }),
      ...(data.categorias !== undefined && { categorias: data.categorias }),
    },
  })

  revalidatePath("/dashboard/fornecedores")
  return { success: true, fornecedor }
}

/**
 * Deletes a fornecedor.
 * Checks for existing cotacoes or pedidos before deleting to prevent orphaned data.
 */
export async function deleteFornecedor(id: string) {
  const { session, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  // Check for existing cotacoes
  const cotacaoCount = await tenantClient.compraCotacao.count({
    where: { fornecedorId: id },
  })

  if (cotacaoCount > 0) {
    return {
      error: `Nao e possivel excluir: fornecedor possui ${cotacaoCount} cotacao(oes) vinculada(s).`,
    }
  }

  // Check for existing pedidos
  const pedidoCount = await tenantClient.compraPedido.count({
    where: { fornecedorId: id },
  })

  if (pedidoCount > 0) {
    return {
      error: `Nao e possivel excluir: fornecedor possui ${pedidoCount} pedido(s) vinculado(s).`,
    }
  }

  await tenantClient.fornecedor.delete({ where: { id } })

  revalidatePath("/dashboard/fornecedores")
  return { success: true }
}
