"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import {
  createDepositoSchema,
  addMovimentacaoSchema,
  type CreateDepositoInput,
  type AddMovimentacaoInput,
} from "@/lib/validations/estoque"
import { emitNotification } from "@/lib/actions/notification"

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
    return { error: "Permissao negada: apenas ADMIN e ENGENHEIRO podem gerenciar estoque" }
  }
  return null
}

// ---- Deposito Actions ----

/**
 * Creates a new Deposito for an obra.
 */
export async function createDeposito(input: CreateDepositoInput) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = createDepositoSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  const deposito = await tenantClient.deposito.create({
    data: {
      tenantId: empresa.tenantId,
      obraId: data.obraId,
      nome: data.nome,
      tipo: data.tipo ?? "almoxarifado",
    },
  })

  revalidatePath(`/dashboard/obras/${data.obraId}/estoque`)
  return { success: true, deposito }
}

/**
 * Lists all depositos for an obra.
 */
export async function listDepositos(obraId: string) {
  const { tenantClient } = await getTenantContext()

  const depositos = await tenantClient.deposito.findMany({
    where: { obraId },
    orderBy: { createdAt: "asc" },
  })

  return depositos
}

// ---- Movimentacao Actions ----

/**
 * Calculates current stock balance for a deposito per material.
 * Returns net balance: sum(ENTRADA) - sum(SAIDA).
 * quantidadeMinima is tracked from the most recent ENTRADA for each material.
 */
export async function getEstoqueAtual(depositoId: string) {
  const { tenantClient } = await getTenantContext()

  const movimentacoes = await tenantClient.movimentacaoEstoque.findMany({
    where: { depositoId },
    orderBy: { createdAt: "asc" },
  })

  // Aggregate by descricao
  const balances: Record<
    string,
    {
      descricao: string
      unidade: string
      saldo: number
      quantidadeMinima: number | null
    }
  > = {}

  for (const mov of movimentacoes) {
    const key = mov.descricao
    if (!balances[key]) {
      balances[key] = {
        descricao: mov.descricao,
        unidade: mov.unidade,
        saldo: 0,
        quantidadeMinima: null,
      }
    }

    const qty = parseFloat(String(mov.quantidade))
    if (mov.tipo === "ENTRADA") {
      balances[key].saldo += qty
      // Track quantidadeMinima from etapaDestino metadata if stored
      if (mov.etapaDestino?.startsWith("min:")) {
        const minVal = parseFloat(mov.etapaDestino.substring(4))
        if (!isNaN(minVal)) {
          balances[key].quantidadeMinima = minVal
        }
      }
    } else if (mov.tipo === "SAIDA") {
      balances[key].saldo -= qty
    }
    // TRANSFERENCIA is handled by separate SAIDA + ENTRADA records
  }

  return Object.values(balances)
}

/**
 * Returns aggregated stock balances across all depositos of an obra,
 * with low stock flag when saldo < quantidadeMinima.
 */
export async function getEstoqueResumo(obraId: string) {
  const { tenantClient } = await getTenantContext()

  const depositos = await tenantClient.deposito.findMany({
    where: { obraId },
    select: { id: true, nome: true },
  })

  const results = []
  for (const dep of depositos) {
    const items = await getEstoqueAtual(dep.id)
    results.push({
      depositoId: dep.id,
      depositoNome: dep.nome,
      items: items.map((item) => ({
        ...item,
        lowStock:
          item.quantidadeMinima !== null && item.saldo < item.quantidadeMinima,
      })),
    })
  }

  return results
}

/**
 * Records a stock movement (ENTRADA, SAIDA, or TRANSFERENCIA).
 * - SAIDA: checks current balance in a $transaction, rejects if insufficient.
 * - TRANSFERENCIA: creates SAIDA on source + ENTRADA on destination atomically.
 * - After SAIDA or TRANSFERENCIA source, calls checkLowStock.
 */
export async function addMovimentacao(input: AddMovimentacaoInput) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const result = addMovimentacaoSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const data = result.data

  if (data.tipo === "ENTRADA") {
    // Store quantidadeMinima in etapaDestino as metadata if provided
    const etapaDestino = data.quantidadeMinima !== undefined
      ? `min:${data.quantidadeMinima}`
      : (data.etapaId ?? null)

    const mov = await tenantClient.movimentacaoEstoque.create({
      data: {
        tenantId: empresa.tenantId,
        depositoId: data.depositoId,
        tipo: "ENTRADA",
        descricao: data.descricao,
        unidade: data.unidade,
        quantidade: data.quantidade,
        pedidoId: data.pedidoId ?? null,
        etapaDestino,
        registradoPor: session.user.id,
      },
    })

    revalidatePath(`/dashboard/obras`)
    return { success: true, movimentacao: mov }
  }

  if (data.tipo === "SAIDA") {
    // Use $transaction to check saldo and create SAIDA atomically
    try {
      const movimentacao = await prisma.$transaction(async (tx) => {
        const movs = await tx.movimentacaoEstoque.findMany({
          where: { depositoId: data.depositoId, descricao: data.descricao },
        })

        let saldo = 0
        for (const mov of movs) {
          const qty = parseFloat(String(mov.quantidade))
          if (mov.tipo === "ENTRADA") saldo += qty
          else if (mov.tipo === "SAIDA") saldo -= qty
        }

        if (saldo < data.quantidade) {
          throw new Error("Estoque insuficiente")
        }

        return tx.movimentacaoEstoque.create({
          data: {
            tenantId: empresa.tenantId,
            depositoId: data.depositoId,
            tipo: "SAIDA",
            descricao: data.descricao,
            unidade: data.unidade,
            quantidade: data.quantidade,
            pedidoId: data.pedidoId ?? null,
            etapaDestino: data.etapaId ?? null,
            registradoPor: session.user.id,
          },
        })
      })

      // Check low stock after SAIDA
      await checkLowStock(data.depositoId, data.descricao)

      revalidatePath(`/dashboard/obras`)
      return { success: true, movimentacao }
    } catch (err) {
      if (err instanceof Error && err.message === "Estoque insuficiente") {
        return { error: "Estoque insuficiente" }
      }
      throw err
    }
  }

  if (data.tipo === "TRANSFERENCIA") {
    if (!data.depositoDestinoId) {
      return { error: "depositoDestinoId e obrigatorio para transferencias" }
    }

    try {
      const movimentacoes = await prisma.$transaction(async (tx) => {
        const movs = await tx.movimentacaoEstoque.findMany({
          where: { depositoId: data.depositoId, descricao: data.descricao },
        })

        let saldo = 0
        for (const mov of movs) {
          const qty = parseFloat(String(mov.quantidade))
          if (mov.tipo === "ENTRADA") saldo += qty
          else if (mov.tipo === "SAIDA") saldo -= qty
        }

        if (saldo < data.quantidade) {
          throw new Error("Estoque insuficiente")
        }

        // Create SAIDA on source deposito
        const saida = await tx.movimentacaoEstoque.create({
          data: {
            tenantId: empresa.tenantId,
            depositoId: data.depositoId,
            tipo: "SAIDA",
            descricao: data.descricao,
            unidade: data.unidade,
            quantidade: data.quantidade,
            origemId: data.depositoId,
            destinoId: data.depositoDestinoId,
            etapaDestino: data.etapaId ?? null,
            registradoPor: session.user.id,
          },
        })

        // Create ENTRADA on destination deposito
        const entrada = await tx.movimentacaoEstoque.create({
          data: {
            tenantId: empresa.tenantId,
            depositoId: data.depositoDestinoId!,
            tipo: "ENTRADA",
            descricao: data.descricao,
            unidade: data.unidade,
            quantidade: data.quantidade,
            origemId: data.depositoId,
            destinoId: data.depositoDestinoId,
            etapaDestino: data.etapaId ?? null,
            registradoPor: session.user.id,
          },
        })

        return { saida, entrada }
      })

      // Check low stock on source after transfer SAIDA
      await checkLowStock(data.depositoId, data.descricao)

      revalidatePath(`/dashboard/obras`)
      return { success: true, ...movimentacoes }
    } catch (err) {
      if (err instanceof Error && err.message === "Estoque insuficiente") {
        return { error: "Estoque insuficiente" }
      }
      throw err
    }
  }

  return { error: "Tipo de movimentacao invalido" }
}

/**
 * Checks if current stock for a material in a deposito is below minimum.
 * If below, emits "estoque-baixo" notification to ADMIN and ENGENHEIRO members.
 */
export async function checkLowStock(
  depositoId: string,
  descricao: string,
  quantidadeMinima?: number
): Promise<void> {
  try {
    const { empresa, tenantClient } = await getTenantContext()

    // Get current saldo
    const movs = await tenantClient.movimentacaoEstoque.findMany({
      where: { depositoId, descricao },
    })

    let saldo = 0
    let minima = quantidadeMinima ?? null

    for (const mov of movs) {
      const qty = parseFloat(String(mov.quantidade))
      if (mov.tipo === "ENTRADA") {
        saldo += qty
        // Extract quantidadeMinima from etapaDestino metadata
        if (mov.etapaDestino?.startsWith("min:")) {
          const minVal = parseFloat(mov.etapaDestino.substring(4))
          if (!isNaN(minVal)) {
            minima = minVal
          }
        }
      } else if (mov.tipo === "SAIDA") {
        saldo -= qty
      }
    }

    if (minima === null || saldo >= minima) {
      return
    }

    // Get the deposito to find obraId
    const deposito = await tenantClient.deposito.findUnique({
      where: { id: depositoId },
      select: { obraId: true },
    })

    if (!deposito) return

    // Notify ADMIN and ENGENHEIRO members
    const members = await prisma.obraMember.findMany({
      where: {
        obraId: deposito.obraId,
        tenantId: empresa.tenantId,
        role: { in: ["ADMIN", "ENGENHEIRO"] },
      },
      select: { userId: true },
    })

    const recipientIds = members
      .map((m) => m.userId)
      .filter((id): id is string => id !== null)

    if (recipientIds.length > 0) {
      await emitNotification(
        deposito.obraId,
        "estoque-baixo",
        { depositoId, descricao, saldo, minima },
        recipientIds,
        "estoque_baixo",
        {
          obraId: deposito.obraId,
          depositoId,
          descricao,
          saldo,
          quantidadeMinima: minima,
        }
      )
    }
  } catch {
    // Non-fatal — notification failure should not block movimentacao
  }
}

// ---- deliverPedido ----

/**
 * Marks a CompraPedido as ENTREGUE and atomically creates a MovimentacaoEstoque ENTRADA
 * for each item in the pedido.
 * Links to the first deposito of the obra.
 * Returns error if pedido is already ENTREGUE.
 */
export async function deliverPedido(pedidoId: string) {
  const { session, empresa, tenantClient } = await getTenantContext()

  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  // Load pedido with items
  const pedido = await tenantClient.compraPedido.findUnique({
    where: { id: pedidoId },
    include: { itens: true },
  })

  if (!pedido) {
    return { error: "Pedido nao encontrado" }
  }

  if (pedido.status === "ENTREGUE") {
    return { error: "Pedido ja foi entregue" }
  }

  // Find or create default deposito for the obra
  let deposito = await tenantClient.deposito.findFirst({
    where: { obraId: pedido.obraId },
    orderBy: { createdAt: "asc" },
  })

  if (!deposito) {
    // Auto-create default deposito
    deposito = await tenantClient.deposito.create({
      data: {
        tenantId: empresa.tenantId,
        obraId: pedido.obraId,
        nome: "Almoxarifado",
        tipo: "almoxarifado",
      },
    })
  }

  const depositoId = deposito.id

  // Atomic transaction: update pedido + update requisicoes + create ENTRADA per item
  await prisma.$transaction(async (tx) => {
    // 1. Update CompraPedido status to ENTREGUE
    await tx.compraPedido.update({
      where: { id: pedidoId },
      data: {
        status: "ENTREGUE",
        // entregueEm not in schema — omitted
      },
    })

    // 2. Update linked CompraRequisicao status
    // RequisicaoStatus does not have ENTREGUE — mark as APROVADA (fulfilled)
    for (const item of pedido.itens) {
      if (item.requisicaoId) {
        await tx.compraRequisicao.update({
          where: { id: item.requisicaoId },
          data: { status: "APROVADA" },
        })
      }
    }

    // 3. Create ENTRADA movimentacao for each item
    for (const item of pedido.itens) {
      await tx.movimentacaoEstoque.create({
        data: {
          tenantId: empresa.tenantId,
          depositoId,
          tipo: "ENTRADA",
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: parseFloat(String(item.quantidade)),
          pedidoId,
          registradoPor: session.user.id,
        },
      })
    }
  })

  revalidatePath(`/dashboard/obras/${pedido.obraId}/compras`)
  revalidatePath(`/dashboard/obras/${pedido.obraId}/estoque`)
  return { success: true }
}
