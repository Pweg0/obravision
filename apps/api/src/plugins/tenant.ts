import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify"

/**
 * Tenant RLS plugin for Fastify.
 * Reads the tenant ID from the authenticated session (JWT header or cookie)
 * and sets up the RLS context for database queries.
 *
 * Phase 2+ will implement full auth verification here.
 * For now, this is a scaffold with the hook structure in place.
 */
const tenantPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      // Phase 2: Extract tenantId from validated JWT
      // For now, store a placeholder for the RLS context
      // request.tenantId will be used in route handlers to create tenant-scoped DB client
      ;(request as FastifyRequest & { tenantId?: string }).tenantId = undefined
    }
  )
}

export default tenantPlugin
