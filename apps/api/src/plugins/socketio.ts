import fp from "fastify-plugin"
import type { FastifyPluginAsync } from "fastify"
import { Server as SocketIOServer } from "socket.io"

declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer
  }
}

/**
 * Socket.io Fastify plugin.
 *
 * Attaches Socket.io directly to fastify.server after fastify.ready().
 * Uses fastify-plugin (fp) so the io decoration is NOT scoped to a child plugin context
 * but available on the root fastify instance (and therefore in all route handlers).
 *
 * Note: fastify-socket.io npm package is abandoned for Fastify 5 — direct attachment
 * via new SocketIOServer(fastify.server) is the recommended approach per RESEARCH.md.
 */
const socketioPlugin: FastifyPluginAsync = async (fastify) => {
  // Socket.io must be created after fastify.ready() so the HTTP server is fully initialized.
  // We use the `onReady` hook which fires after all plugins are registered and the server is ready.
  fastify.addHook("onReady", async () => {
    const io = new SocketIOServer(fastify.server, {
      cors: {
        origin: process.env.WEB_URL ?? "http://localhost:3000",
        credentials: true,
      },
    })

    // Decorate fastify instance so routes and workers can access io via fastify.io
    fastify.decorate("io", io)

    // Room management: per-obra rooms for real-time notifications
    io.on("connection", (socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`)

      socket.on("join-obra", (obraId: string) => {
        socket.join(`obra:${obraId}`)
        fastify.log.info(`Socket ${socket.id} joined obra:${obraId}`)
      })

      socket.on("leave-obra", (obraId: string) => {
        socket.leave(`obra:${obraId}`)
        fastify.log.info(`Socket ${socket.id} left obra:${obraId}`)
      })

      socket.on("disconnect", () => {
        fastify.log.info(`Socket disconnected: ${socket.id}`)
      })
    })

    fastify.log.info("Socket.io attached to Fastify HTTP server")
  })
}

export default fp(socketioPlugin, {
  name: "socketio",
  fastify: "5.x",
})

/**
 * Helper to get the io instance from outside a route context
 * (e.g., BullMQ workers that don't have access to the fastify instance).
 * This is set by app.ts after the plugin is registered.
 */
let _io: SocketIOServer | null = null

export function setIoInstance(io: SocketIOServer) {
  _io = io
}

export function getIoInstance(): SocketIOServer | null {
  return _io
}
