import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock next-auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-1",
      role: "ADMIN",
      empresaId: "empresa-1",
    },
  }),
}))

// Mock tenant client factory — must be defined before vi.mock to avoid TDZ
const mockTenantClient = {
  obra: {
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock("@obravision/db/rls-client", () => ({
  createTenantClient: vi.fn(() => mockTenantClient),
}))

vi.mock("@obravision/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn().mockResolvedValue({
        id: "empresa-1",
        tenantId: "tenant-1",
      }),
    },
    obraStatus: {
      findFirst: vi.fn().mockResolvedValue({
        id: "status-1",
        tenantId: "tenant-1",
        name: "Em andamento",
        color: "#1A6B5A",
        empresaId: "empresa-1",
      }),
    },
  },
}))

import { geocodeAddress, createObra } from "@/lib/actions/obra"

const mockObra = {
  id: "obra-1",
  tenantId: "tenant-1",
  nome: "Edificio Alpha",
  logradouro: "Rua das Flores",
  numero: "100",
  cidade: "Sao Paulo",
  estado: "SP",
  cep: "01310-100",
  tipo: "RESIDENCIAL",
  area: 200,
  lat: null,
  lon: null,
  archived: false,
  statusId: null,
  empresaId: "empresa-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
}

describe("geocodeAddress", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it("returns { lat, lon } when Nominatim returns a valid result", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "-23.5505", lon: "-46.6333" }],
    } as Response)

    const result = await geocodeAddress("Rua das Flores", "100", "Sao Paulo", "SP", "01310-100")

    expect(result).not.toBeNull()
    expect(result?.lat).toBeCloseTo(-23.5505)
    expect(result?.lon).toBeCloseTo(-46.6333)
  })

  it("returns null when Nominatim returns empty results", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const result = await geocodeAddress("Rua Inexistente", "999", "Cidade Fantasma", "XX", "00000-000")

    expect(result).toBeNull()
  })

  it("returns null when fetch throws (non-fatal network failure)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    const result = await geocodeAddress("Rua das Flores", "100", "Sao Paulo", "SP", "01310-100")

    expect(result).toBeNull()
  })

  it("returns null when Nominatim returns non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    } as Response)

    const result = await geocodeAddress("Rua das Flores", "100", "Sao Paulo", "SP", "01310-100")

    expect(result).toBeNull()
  })

  it("calls Nominatim with correct query and User-Agent header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "-23.5505", lon: "-46.6333" }],
    } as Response)
    global.fetch = fetchMock

    await geocodeAddress("Rua das Flores", "100", "Sao Paulo", "SP", "01310-100")

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("nominatim.openstreetmap.org/search")
    expect(url).toContain("format=json")
    expect(url).toContain("limit=1")
    expect((options?.headers as Record<string, string>)?.["User-Agent"]).toBe("ObraVision/1.0")
  })
})

describe("createObra with geocoding", () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    // Reset only the tenant client mocks (not all mocks, to preserve prisma vi.fn defaults)
    mockTenantClient.obra.create.mockReset()
    mockTenantClient.obra.update.mockReset()
    mockTenantClient.obra.create.mockResolvedValue(mockObra)
    mockTenantClient.obra.update.mockResolvedValue({ ...mockObra, lat: -23.5505, lon: -46.6333 })
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("calls geocodeAddress and updates obra with lat/lon on success", async () => {
    // Mock Nominatim to succeed
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "-23.5505", lon: "-46.6333" }],
    } as Response)

    const formData = new FormData()
    formData.set("nome", "Edificio Alpha")
    formData.set("logradouro", "Rua das Flores")
    formData.set("numero", "100")
    formData.set("cidade", "Sao Paulo")
    formData.set("estado", "SP")
    formData.set("cep", "01310100")
    formData.set("tipo", "RESIDENCIAL")
    formData.set("area", "200")

    const result = await createObra(formData)

    expect(result.success).toBe(true)
    // geocodeAddress triggers an obra update with lat/lon
    expect(mockTenantClient.obra.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lat: expect.any(Number),
          lon: expect.any(Number),
        }),
      })
    )
  })

  it("still creates obra when geocoding fails (non-fatal)", async () => {
    // Mock Nominatim to fail
    global.fetch = vi.fn().mockRejectedValue(new Error("Nominatim unreachable"))

    const formData = new FormData()
    formData.set("nome", "Edificio Beta")
    formData.set("logradouro", "Av Paulista")
    formData.set("numero", "1000")
    formData.set("cidade", "Sao Paulo")
    formData.set("estado", "SP")
    formData.set("cep", "01310200")
    formData.set("tipo", "COMERCIAL")
    formData.set("area", "500")

    const result = await createObra(formData)

    // obra was still created
    expect(result.success).toBe(true)
    // update NOT called since geocoding returned null
    expect(mockTenantClient.obra.update).not.toHaveBeenCalled()
  })
})
