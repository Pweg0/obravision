/**
 * RLS Isolation Test
 *
 * Verifies that PostgreSQL Row Level Security prevents cross-tenant data access.
 * This test requires a running PostgreSQL instance with the schema and RLS policies applied.
 *
 * Run: DATABASE_URL=<url> pnpm vitest run tests/rls-isolation.test.ts
 *
 * The test is structured to be SKIPPED in CI without a real DB.
 * Set INTEGRATION_TEST=true to run against a real database.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { PrismaClient } from "@prisma/client"
import { createTenantClient } from "../src/rls-client"

const SHOULD_RUN_INTEGRATION = process.env.INTEGRATION_TEST === "true"

// Helper to skip integration tests when no DB available
const itIntegration = SHOULD_RUN_INTEGRATION ? it : it.skip

const adminPrisma = new PrismaClient()

describe("RLS Tenant Isolation", () => {
  let tenantAId: string
  let tenantBId: string
  let empresaAId: string
  let empresaBId: string

  beforeAll(async () => {
    if (!SHOULD_RUN_INTEGRATION) return

    // Create two distinct empresas (tenants) for isolation testing
    const empresaA = await adminPrisma.empresa.create({
      data: { nome: "Empresa Test A (RLS)", tenantId: "test-tenant-a-rls" },
    })
    const empresaB = await adminPrisma.empresa.create({
      data: { nome: "Empresa Test B (RLS)", tenantId: "test-tenant-b-rls" },
    })

    tenantAId = empresaA.tenantId
    tenantBId = empresaB.tenantId
    empresaAId = empresaA.id
    empresaBId = empresaB.id
  })

  afterAll(async () => {
    if (!SHOULD_RUN_INTEGRATION) return

    // Clean up test data
    await adminPrisma.obra.deleteMany({
      where: { tenantId: { in: ["test-tenant-a-rls", "test-tenant-b-rls"] } },
    })
    await adminPrisma.empresa.deleteMany({
      where: {
        tenantId: { in: ["test-tenant-a-rls", "test-tenant-b-rls"] },
      },
    })
    await adminPrisma.$disconnect()
  })

  itIntegration(
    "Tenant B cannot see Tenant A obras (RLS read isolation)",
    async () => {
      const clientA = createTenantClient(tenantAId)
      const clientB = createTenantClient(tenantBId)

      // Tenant A creates an obra
      await clientA.obra.create({
        data: {
          tenantId: tenantAId,
          nome: "Obra Secreta de Tenant A",
          logradouro: "Rua Teste",
          numero: "123",
          cidade: "Sao Paulo",
          estado: "SP",
          cep: "01310-100",
          tipo: "RESIDENCIAL",
          area: 100.0,
          empresaId: empresaAId,
        },
      })

      // Tenant B queries obras — should see zero results (RLS blocks them)
      const tenantBObras = await clientB.obra.findMany()
      expect(tenantBObras).toHaveLength(0)
    }
  )

  itIntegration(
    "Tenant B cannot INSERT obra with Tenant A tenantId (RLS WITH CHECK)",
    async () => {
      const clientB = createTenantClient(tenantBId)

      // Attempt to insert obra with Tenant A's tenantId — RLS WITH CHECK should block it
      await expect(
        clientB.obra.create({
          data: {
            tenantId: tenantAId, // Cross-tenant write attempt
            nome: "Unauthorized Cross-Tenant Obra",
            logradouro: "Rua Invasora",
            numero: "999",
            cidade: "Rio de Janeiro",
            estado: "RJ",
            cep: "20040-020",
            tipo: "COMERCIAL",
            area: 200.0,
            empresaId: empresaAId,
          },
        })
      ).rejects.toThrow()
    }
  )

  it("createTenantClient function is exported and callable (unit check)", () => {
    // This test always runs — verifies the module exports work correctly
    expect(typeof createTenantClient).toBe("function")

    // Should return an object with Prisma client methods (not throw)
    const client = createTenantClient("test-tenant-unit")
    expect(client).toBeDefined()
    expect(typeof client.obra).toBe("object")
  })
})
