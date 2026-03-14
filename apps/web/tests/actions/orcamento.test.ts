import { describe, it, expect, vi, beforeEach } from "vitest"

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

const mockOrcamentoItem = {
  id: "item-1",
  tenantId: "tenant-1",
  etapaId: "etapa-1",
  descricao: "Concreto fck 25",
  unidade: "m3",
  quantidade: "10.0000",
  custoUnitario: "350.0000",
  sinapiCodigo: "74209/001",
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockOrcamentoEtapa = {
  id: "etapa-1",
  tenantId: "tenant-1",
  orcamentoId: "orc-1",
  nome: "Fundacao",
  ordem: 1,
  itens: [mockOrcamentoItem],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockOrcamento = {
  id: "orc-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  bdi: "0.00",
  etapas: [mockOrcamentoEtapa],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

// Mock tenant client
const mockTenantClient = {
  orcamento: {
    findUnique: vi.fn(),
    create: vi.fn().mockResolvedValue(mockOrcamento),
    update: vi.fn().mockResolvedValue(mockOrcamento),
  },
  orcamentoEtapa: {
    create: vi.fn().mockResolvedValue(mockOrcamentoEtapa),
    findUnique: vi.fn().mockResolvedValue(mockOrcamentoEtapa),
    count: vi.fn().mockResolvedValue(0),
    delete: vi.fn().mockResolvedValue(mockOrcamentoEtapa),
  },
  orcamentoItem: {
    create: vi.fn().mockResolvedValue(mockOrcamentoItem),
    createMany: vi.fn().mockResolvedValue({ count: 3 }),
    update: vi.fn().mockResolvedValue(mockOrcamentoItem),
    delete: vi.fn().mockResolvedValue(mockOrcamentoItem),
  },
}

vi.mock("@projetapro/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn().mockResolvedValue({
        id: "empresa-1",
        tenantId: "tenant-1",
      }),
    },
    $queryRawUnsafe: vi.fn().mockResolvedValue([
      {
        id: "sinapi-1",
        codigo: "74209/001",
        descricao: "CONCRETO FCK=25MPA",
        unidade: "M3",
        custoUnitario: "350.0000",
        estado: "SP",
      },
    ]),
  },
}))

vi.mock("@projetapro/db/rls-client", () => ({
  createTenantClient: vi.fn(() => mockTenantClient),
}))

describe("orcamento server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTenantClient.orcamento.findUnique.mockResolvedValue(null)
    mockTenantClient.orcamento.create.mockResolvedValue(mockOrcamento)
    mockTenantClient.orcamento.update.mockResolvedValue(mockOrcamento)
    mockTenantClient.orcamentoEtapa.create.mockResolvedValue(mockOrcamentoEtapa)
    mockTenantClient.orcamentoEtapa.findUnique.mockResolvedValue(mockOrcamentoEtapa)
    mockTenantClient.orcamentoEtapa.count.mockResolvedValue(0)
    mockTenantClient.orcamentoEtapa.delete.mockResolvedValue(mockOrcamentoEtapa)
    mockTenantClient.orcamentoItem.create.mockResolvedValue(mockOrcamentoItem)
    mockTenantClient.orcamentoItem.createMany.mockResolvedValue({ count: 3 })
    mockTenantClient.orcamentoItem.update.mockResolvedValue(mockOrcamentoItem)
    mockTenantClient.orcamentoItem.delete.mockResolvedValue(mockOrcamentoItem)
  })

  describe("createOrcamento", () => {
    it("creates an orcamento with default BDI 0", async () => {
      const { createOrcamento } = await import("@/lib/actions/orcamento")
      const result = await createOrcamento("obra-1")
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.orcamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ obraId: "obra-1" }),
        })
      )
    })
  })

  describe("createEtapa", () => {
    it("creates an etapa with valid data", async () => {
      const { createEtapa } = await import("@/lib/actions/orcamento")
      const result = await createEtapa({
        orcamentoId: "orc-1",
        nome: "Fundacao",
        ordem: 1,
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.orcamentoEtapa.create).toHaveBeenCalled()
    })

    it("returns error for missing nome", async () => {
      const { createEtapa } = await import("@/lib/actions/orcamento")
      const result = await createEtapa({ orcamentoId: "orc-1", nome: "", ordem: 1 })
      expect(result).toHaveProperty("error")
    })
  })

  describe("createItem", () => {
    it("creates an item and stores Decimal values", async () => {
      const { createItem } = await import("@/lib/actions/orcamento")
      const result = await createItem({
        etapaId: "etapa-1",
        descricao: "Concreto fck 25",
        unidade: "m3",
        quantidade: 10,
        custoUnitario: 350,
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.orcamentoItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            etapaId: "etapa-1",
            descricao: "Concreto fck 25",
            unidade: "m3",
          }),
        })
      )
    })

    it("returns error for invalid data", async () => {
      const { createItem } = await import("@/lib/actions/orcamento")
      const result = await createItem({
        etapaId: "etapa-1",
        descricao: "",
        unidade: "m3",
        quantidade: 10,
        custoUnitario: 350,
      })
      expect(result).toHaveProperty("error")
    })
  })

  describe("updateBdi", () => {
    it("updates the BDI percentage", async () => {
      mockTenantClient.orcamento.update.mockResolvedValue({ ...mockOrcamento, bdi: "25.00" })
      const { updateBdi } = await import("@/lib/actions/orcamento")
      const result = await updateBdi("orc-1", 25)
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.orcamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "orc-1" },
          data: expect.objectContaining({ bdi: 25 }),
        })
      )
    })

    it("returns error for invalid BDI percentage", async () => {
      const { updateBdi } = await import("@/lib/actions/orcamento")
      const result = await updateBdi("orc-1", -5)
      expect(result).toHaveProperty("error")
    })
  })

  describe("searchSinapi", () => {
    it("returns empty array for empty query", async () => {
      const { searchSinapi } = await import("@/lib/actions/orcamento")
      const result = await searchSinapi("", "SP")
      expect(result).toEqual([])
    })

    it("returns results for valid query", async () => {
      const { searchSinapi } = await import("@/lib/actions/orcamento")
      const result = await searchSinapi("concreto", "SP")
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe("importFromSheet", () => {
    it("parses rows and creates items via createMany", async () => {
      // Create a minimal valid XLSX buffer using SheetJS
      const XLSX = await import("xlsx")
      const ws = XLSX.utils.aoa_to_sheet([
        ["Descricao", "Unidade", "Quantidade", "Custo Unitario", "Etapa"],
        ["Concreto fck 25", "m3", "10", "350.00", "etapa-1"],
        ["Aco CA-50", "kg", "500", "8.50", "etapa-1"],
        ["Forma de madeira", "m2", "200", "45.00", "etapa-1"],
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Orcamento")
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

      const formData = new FormData()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      formData.append("file", blob, "orcamento.xlsx")
      formData.append("etapaId", "etapa-1")

      const { importFromSheet } = await import("@/lib/actions/orcamento")
      const result = await importFromSheet(formData)
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.orcamentoItem.createMany).toHaveBeenCalled()
    })
  })
})
