import Fastify from "fastify"
import cors from "@fastify/cors"
import { plantasRoutes } from "./routes/plantas"
import { notificationsRoutes } from "./routes/notifications"
import socketioPlugin, { setIoInstance } from "./plugins/socketio"
import { setSocketIo } from "./queues/pdf-conversion.worker"

const fastify = Fastify({
  logger: true,
})

// CORS for the web app
await fastify.register(cors, {
  origin: process.env.WEB_URL ?? "http://localhost:3000",
  credentials: true,
})

// Socket.io plugin — attaches io to fastify.server after fastify.ready()
await fastify.register(socketioPlugin)

// Health check
fastify.get("/health", async () => {
  return { status: "ok", service: "obravision-api", timestamp: new Date().toISOString() }
})

// Register routes
await fastify.register(plantasRoutes)
await fastify.register(notificationsRoutes)

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT ?? "4000", 10)
    await fastify.listen({ port, host: "0.0.0.0" })
    fastify.log.info(`Server listening on port ${port}`)

    // After listen, the Socket.io instance is available via fastify.io (set in onReady hook)
    // Inject io into the PDF conversion worker for tiles-ready events
    setSocketIo(fastify.io)

    // Also expose via module-level setter for any code outside fastify context
    setIoInstance(fastify.io)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export { fastify }
