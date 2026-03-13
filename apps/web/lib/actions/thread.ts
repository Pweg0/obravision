"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { addMessageSchema } from "@/lib/validations/pin"

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
 * Parses @userId mentions from content string.
 * Returns an array of user IDs found in the format @[userId].
 * Mentions in content are written as @userId (alphanumeric + hyphen).
 */
function parseMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const matches = content.matchAll(mentionRegex)
  return [...matches].map((m) => m[1])
}

/**
 * Adds a message to a thread.
 * Permission: Admin + Engenheiro only.
 */
export async function addMessage(threadId: string, formData: FormData) {
  const { session, empresa, tenantClient } = await getTenantContext()

  if (session.user.role !== "ADMIN" && session.user.role !== "ENGENHEIRO") {
    return { error: "Permissao negada: apenas Admin e Engenheiro podem comentar" }
  }

  const rawData = {
    content: formData.get("content") as string,
    mentions: [] as string[],
  }

  const result = addMessageSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Dados invalidos" }
  }

  const validData = result.data

  // Verify thread exists and belongs to this tenant
  const thread = await tenantClient.thread.findUnique({
    where: { id: threadId },
    include: {
      pin: {
        include: {
          plantaRevisao: {
            include: { planta: true },
          },
        },
      },
    },
  })

  if (!thread || thread.deletedAt) {
    return { error: "Thread nao encontrada" }
  }

  // Parse @mentions from content
  const mentions = parseMentions(validData.content)

  const message = await tenantClient.threadMessage.create({
    data: {
      tenantId: empresa.tenantId,
      threadId,
      authorId: session.user.id,
      content: validData.content,
      mentions,
    },
  })

  revalidatePath(
    `/dashboard/obras/${thread.pin.plantaRevisao.planta.obraId}/plantas/${thread.pin.plantaRevisao.plantaId}`
  )

  return { success: true, message }
}

/**
 * Soft-deletes a thread message.
 * Permission: message author or Admin.
 */
export async function deleteMessage(messageId: string) {
  const { session, tenantClient } = await getTenantContext()

  const message = await tenantClient.threadMessage.findUnique({
    where: { id: messageId },
    include: {
      thread: {
        include: {
          pin: {
            include: {
              plantaRevisao: {
                include: { planta: true },
              },
            },
          },
        },
      },
    },
  })

  if (!message) {
    return { error: "Mensagem nao encontrada" }
  }

  if (message.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return { error: "Permissao negada" }
  }

  await tenantClient.threadMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(
    `/dashboard/obras/${message.thread.pin.plantaRevisao.planta.obraId}/plantas/${message.thread.pin.plantaRevisao.plantaId}`
  )

  return { success: true }
}

export type ThreadWithMessages = {
  id: string
  pinId: string
  messages: {
    id: string
    threadId: string
    authorId: string
    content: string
    mentions: string[]
    deletedAt: Date | null
    createdAt: Date
    author: {
      id: string
      name: string | null
      image: string | null
    }
  }[]
}

/**
 * Returns a thread with all messages (including soft-deleted ones for display as "Mensagem removida").
 * Includes author info for each message.
 */
export async function getThread(pinId: string): Promise<ThreadWithMessages | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return null
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return null

  const tenantClient = createTenantClient(empresa.tenantId)

  const thread = await tenantClient.thread.findUnique({
    where: { pinId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!thread) return null

  // Fetch author info for all messages (including soft-deleted)
  const authorIds = [...new Set(thread.messages.map((m) => m.authorId))]
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, image: true },
  })
  const authorMap = new Map(authors.map((a) => [a.id, a]))

  return {
    id: thread.id,
    pinId: thread.pinId,
    messages: thread.messages.map((msg) => ({
      ...msg,
      author: authorMap.get(msg.authorId) ?? {
        id: msg.authorId,
        name: null,
        image: null,
      },
    })),
  }
}
