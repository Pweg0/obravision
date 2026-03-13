"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"

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

export interface NotificationPayload {
  obraId?: string
  obraName?: string
  plantaId?: string
  plantaName?: string
  revisaoId?: string
  pinId?: string
  threadId?: string
  authorName?: string
  authorId?: string
  preview?: string
  mentionedUserId?: string
  [key: string]: unknown
}

export interface NotificationItem {
  id: string
  type: string
  payload: NotificationPayload
  readAt: Date | null
  createdAt: Date
}

/**
 * Returns notifications for the current user, ordered by createdAt desc.
 * Default limit: 20.
 */
export async function listNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
  cursor?: string
}): Promise<NotificationItem[]> {
  const { session, empresa } = await getTenantContext()

  const limit = options?.limit ?? 20
  const unreadOnly = options?.unreadOnly ?? false

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      tenantId: empresa.tenantId,
      ...(unreadOnly ? { readAt: null } : {}),
      ...(options?.cursor ? { id: { lt: options.cursor } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    payload: n.payload as NotificationPayload,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }))
}

/**
 * Marks a single notification as read (sets readAt to now).
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { session, empresa } = await getTenantContext()

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
      tenantId: empresa.tenantId,
    },
    data: { readAt: new Date() },
  })
}

/**
 * Marks all unread notifications as read for the current user.
 */
export async function markAllAsRead(): Promise<void> {
  const { session, empresa } = await getTenantContext()

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      tenantId: empresa.tenantId,
      readAt: null,
    },
    data: { readAt: new Date() },
  })
}

/**
 * Returns the count of unread notifications for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id || !session.user.empresaId) {
    return 0
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return 0

  return prisma.notification.count({
    where: {
      userId: session.user.id,
      tenantId: empresa.tenantId,
      readAt: null,
    },
  })
}

/**
 * Creates Notification records for each recipient and emits a socket event
 * to the obra room via the Fastify API.
 *
 * Used by pin.ts and thread.ts server actions after successful creation:
 * - createPin → "new-pin" event to all obra members except author
 * - addMessage → "new-reply" event to thread participants + @mentioned users
 * - createRevisao → "new-revision" event to all obra members except uploader
 * - @mention → "mention" event directed at mentioned user
 *
 * @param obraId - The obra room to emit to
 * @param event - Socket.io event name ("new-pin" | "new-reply" | "new-revision" | "mention")
 * @param data - Data to include in the socket event payload
 * @param recipientUserIds - User IDs who should receive the DB notification
 * @param type - Notification type (matches event name)
 * @param payload - Data to store in the Notification.payload JSON field
 */
export async function emitNotification(
  obraId: string,
  event: string,
  data: Record<string, unknown>,
  recipientUserIds: string[],
  type: string,
  payload: NotificationPayload
): Promise<void> {
  const { empresa } = await getTenantContext()

  const apiUrl = process.env.API_URL ?? "http://localhost:4000"

  // Create Notification DB records for each recipient
  if (recipientUserIds.length > 0) {
    await Promise.all(
      recipientUserIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            tenantId: empresa.tenantId,
            type,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payload: payload as any, // InputJsonValue — NotificationPayload is valid JSON
          },
        })
      )
    )
  }

  // Emit socket event to the obra room via Fastify API
  try {
    const res = await fetch(`${apiUrl}/api/notifications/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, obraId, data }),
    })

    if (!res.ok) {
      console.error(`[emitNotification] Failed to emit event "${event}": ${res.statusText}`)
    }
  } catch (err) {
    // Non-fatal: notifications delivered via polling fallback
    console.error(`[emitNotification] Socket emit error for event "${event}":`, err)
  }
}

/**
 * Returns the list of member user IDs for an obra (for sending obra-wide notifications).
 * Excludes the given excludeUserId (typically the action author).
 */
export async function getObraMemberIds(obraId: string, excludeUserId?: string): Promise<string[]> {
  const { empresa } = await getTenantContext()

  const members = await prisma.obraMember.findMany({
    where: {
      obraId,
      tenantId: empresa.tenantId,
    },
    select: { userId: true },
  })

  return members
    .map((m) => m.userId)
    .filter((id): id is string => id !== null && id !== excludeUserId)
}
