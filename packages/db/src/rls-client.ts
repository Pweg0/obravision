import { PrismaClient } from "@prisma/client"

/**
 * Creates a tenant-scoped Prisma client that sets the RLS tenant context
 * for every query via PostgreSQL's set_config function.
 *
 * Every query is wrapped in a transaction with:
 *   SELECT set_config('app.current_tenant_id', tenantId, TRUE)
 *
 * This ensures RLS policies on tenant-scoped tables (obras, obra_statuses,
 * obra_members, invitations) filter data to the specified tenant.
 */
export function createTenantClient(tenantId: string) {
  const prisma = new PrismaClient()

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`,
            query(args),
          ])
          return result
        },
      },
    },
  })
}
