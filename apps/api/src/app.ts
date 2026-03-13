import Fastify from "fastify"
import cors from "@fastify/cors"
import { Server as SocketIOServer } from "socket.io"
import { plantasRoutes } from "./routes/plantas"
import { setSocketIo } from "./queues/pdf-conversion.worker"

const fastify = Fastify({
  logger: true,
})

// CORS for the web app
await fastify.register(cors, {
  origin: process.env.WEB_URL ?? "http://localhost:3000",
  credentials: true,
})

// Health check
fastify.get("/health", async () => {
  return { status: "ok", service: "obravision-api", timestamp: new Date().toISOString() }
})

// Register routes
await fastify.register(plantasRoutes)

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT ?? "4000", 10)
    await fastify.listen({ port, host: "0.0.0.0" })
    fastify.log.info(`Server listening on port ${port}`)

    // Attach Socket.io directly to Fastify's Node.js HTTP server
    // (fastify-socket.io is abandoned for Fastify 5 — direct attachment is the recommended approach)
    const io = new SocketIOServer(fastify.server, {
      cors: {
        origin: process.env.WEB_URL ?? "http://localhost:3000",
        credentials: true,
      },
    })

    // Room management: per-obra rooms for real-time notifications
    io.on("connection", (socket) => {
      fastify.log.info(`Socket connected: ${socket.id}`)

      socket.on("join-obra", (obraId: string) => {
        socket.join(`obra:${obraId}`)
        fastify.log.info(`Socket ${socket.id} joined obra:${obraId}`)
      })

      socket.on("leave-obra", (obraId: string) => {
        socket.leave(`obra:${obraId}`)
      })

      socket.on("disconnect", () => {
        fastify.log.info(`Socket disconnected: ${socket.id}`)
      })
    })

    // Inject io into the PDF conversion worker for tiles-ready events
    setSocketIo(io)

    // Export io for use in routes/workers
    return io
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export { fastify }
