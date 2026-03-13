import type { FastifyInstance } from "fastify"
import { prisma } from "@obravision/db"

interface EmitBody {
  event: string
  obraId: string
  data: Record<string, unknown>
}

interface CreateNotificationBody {
  userId: string
  tenantId: string
  type: string
  payload: Record<string, unknown>
  obraId?: string
}

export async function notificationsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/notifications/emit
   *
   * Emits a Socket.io event to all clients in the obra:${obraId} room.
   * Called by Next.js server actions after creating pins, replies, revisions.
   *
   * Events: "new-pin", "new-reply", "new-revision", "mention", "tiles-ready"
   */
  fastify.post<{ Body: EmitBody }>(
    "/api/notifications/emit",
    {
      schema: {
        body: {
          type: "object",
          required: ["event", "obraId", "data"],
          properties: {
            event: { type: "string" },
            obraId: { type: "string" },
            data: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const { event, obraId, data } = request.body

      fastify.io.to(`obra:${obraId}`).emit(event, data)
      fastify.log.info(`Emitted "${event}" to obra:${obraId}`)

      return reply.code(200).send({ ok: true, event, obraId })
    }
  )

  /**
   * POST /api/notifications/create
   *
   * Creates a Notification record in the DB and emits a socket event to
   * the user's obra room. Centralizes notification creation so both
   * Next.js server actions and BullMQ workers can use it.
   */
  fastify.post<{ Body: CreateNotificationBody }>(
    "/api/notifications/create",
    {
      schema: {
        body: {
          type: "object",
          required: ["userId", "tenantId", "type", "payload"],
          properties: {
            userId: { type: "string" },
            tenantId: { type: "string" },
            type: { type: "string" },
            payload: { type: "object" },
            obraId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId, tenantId, type, payload, obraId } = request.body

      // Create the notification record in DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notification = await prisma.notification.create({
        data: {
          userId,
          tenantId,
          type,
          payload: payload as any, // InputJsonValue — Record<string, unknown> is valid JSON
        },
      })

      // If obraId is provided, emit socket event to the obra room
      if (obraId) {
        fastify.io.to(`obra:${obraId}`).emit(type, {
          notificationId: notification.id,
          ...payload,
        })
      }

      fastify.log.info(`Created notification ${notification.id} for user ${userId} (type: ${type})`)

      return reply.code(201).send({ ok: true, notification })
    }
  )
}
