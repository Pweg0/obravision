"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { createPinSchema } from "@/lib/validations/pin"
import { emitNotification, getObraMemberIds } from "./notification"

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

  return { session, empresa, tenantClient: createTenantClient(empresa.tenantId) }
}

/**
 * Creates a pin + thread + initial thread message atomically.
 * Permission: Admin + Engenheiro only.
 */
export async function createPin(
  plantaRevisaoId: string,
  data: { x: number; y: number; pageNumber: number; content: string }
) {
  const { session, empresa, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN" && session.user.role !== "ENGENHEIRO") {
    return { error: "Permissao negada: apenas Admin e Engenheiro podem criar pins" }
  }

  const result = createPinSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const validData = result.data

  // Verify the revisao exists and belongs to this tenant
  const revisao = await tenantClient.plantaRevisao.findUnique({
    where: { id: plantaRevisaoId },
    include: { planta: true },
  })

  if (!revisao) {
    return { error: "Revisao nao encontrada" }
  }

  // Create pin + thread + initial message in a transaction
  const pin = await prisma.$transaction(async (tx) => {
    const createdPin = await tx.pin.create({
      data: {
        tenantId: empresa.tenantId,
        plantaRevisaoId,
        authorId: session.user.id,
        x: validData.x,
        y: validData.y,
        pageNumber: validData.pageNumber,
      },
    })

    const thread = await tx.thread.create({
      data: {
        tenantId: empresa.tenantId,
        pinId: createdPin.id,
      },
    })

    await tx.threadMessage.create({
      data: {
        tenantId: empresa.tenantId,
        threadId: thread.id,
        authorId: session.user.id,
        content: validData.content,
        mentions: [],
      },
    })

    return createdPin
  })

  revalidatePath(
    `/dashboard/obras/${revisao.planta.obraId}/plantas/${revisao.plantaId}`
  )

  // Notify all obra members about the new pin (except the author)
  try {
    const recipientIds = await getObraMemberIds(revisao.planta.obraId, session.user.id)
    if (recipientIds.length > 0) {
      await emitNotification(
        revisao.planta.obraId,
        "new-pin",
        { pinId: pin.id, obraId: revisao.planta.obraId, authorName: session.user.name ?? "Usuario" },
        recipientIds,
        "new_pin",
        {
          obraId: revisao.planta.obraId,
          plantaId: revisao.plantaId,
          plantaName: revisao.planta.nome,
          pinId: pin.id,
          authorName: session.user.name ?? "Usuario",
          authorId: session.user.id,
        }
      )
    }
  } catch (err) {
    // Non-fatal: notification failure should not break pin creation
    console.error("[createPin] Failed to emit notification:", err)
  }

  return { success: true, pin }
}

/**
 * Soft-deletes a pin, its thread, and all thread messages.
 * Permission: pin author or Admin.
 */
export async function deletePin(pinId: string) {
  const { session, tenantClient } = await getTenantContext()

  const pin = await tenantClient.pin.findUnique({
    where: { id: pinId },
    include: {
      thread: {
        include: { messages: true },
      },
      plantaRevisao: {
        include: { planta: true },
      },
    },
  })

  if (!pin) {
    return { error: "Pin nao encontrado" }
  }

  if (pin.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "Permissao negada" }
  }

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    // Soft-delete all thread messages
    if (pin.thread) {
      await tx.threadMessage.updateMany({
        where: { threadId: pin.thread.id, deletedAt: null },
        data: { deletedAt: now },
      })

      // Soft-delete the thread
      await tx.thread.update({
        where: { id: pin.thread.id },
        data: { deletedAt: now },
      })
    }

    // Soft-delete the pin
    await tx.pin.update({
      where: { id: pinId },
      data: { deletedAt: now },
    })
  })

  revalidatePath(
    `/dashboard/obras/${pin.plantaRevisao.planta.obraId}/plantas/${pin.plantaRevisao.plantaId}`
  )

  return { success: true }
}

export type PinWithAuthor = {
  id: string
  tenantId: string
  plantaRevisaoId: string
  authorId: string
  x: number
  y: number
  pageNumber: number
  deletedAt: Date | null
  createdAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
  }
  _count: {
    thread: number
  }
  messageCount: number
}

/**
 * Returns all active pins for a given revisao with author info and message count.
 */
export async function listPinsByRevisao(plantaRevisaoId: string): Promise<PinWithAuthor[]> {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return []
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return []

  const tenantClient = createTenantClient(empresa.tenantId)

  const pins = await tenantClient.pin.findMany({
    where: {
      plantaRevisaoId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  })

  // Fetch author info separately (User is not tenant-scoped)
  const authorIds = [...new Set(pins.map((p) => p.authorId))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, image: true },
  })
  const authorMap = new Map(authors.map((a) => [a.id, a]))

  // Fetch message counts
  const threads = await tenantClient.thread.findMany({
    where: {
      pinId: { in: pins.map((p) => p.id) },
      deletedAt: null,
    },
    include: {
      _count: {
        select: { messages: { where: { deletedAt: null } } },
      },
    },
  })
  const threadMap = new Map(threads.map((t) => [t.pinId, t._count.messages]))

  return pins.map((pin) => ({
    ...pin,
    author: authorMap.get(pin.authorId) ?? { id: pin.authorId, name: null, image: null },
    _count: { thread: threadMap.get(pin.id) ?? 0 },
    messageCount: threadMap.get(pin.id) ?? 0,
  }))
}
