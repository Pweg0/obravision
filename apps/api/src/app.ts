import Fastify from "fastify"

const fastify = Fastify({
  logger: true,
})

// Health check
fastify.get("/health", async () => {
  return { status: "ok", service: "obravision-api", timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT ?? "4000", 10)
    await fastify.listen({ port, host: "0.0.0.0" })
    fastify.log.info(`Server listening on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export { fastify }
