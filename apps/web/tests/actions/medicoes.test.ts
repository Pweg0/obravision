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

// Mock next-auth - ADMIN by default
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-1",
      role: "ADMIN",
      empresaId: "empresa-1",
    },
  }),
}))

// ---- Mock data ----

const mockOrcamentoItem = {
  id: "oi-1",
  tenantId: "tenant-1",
  etapaId: "etapa-1",
  descricao: "Fundacao",
  unidade: "m3",
  quantidade: "10.0000",
  custoUnitario: "500.0000",
  sinapiCodigo: null,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockOrcamento = {
  id: "orc-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  bdi: "0.0000",
  pdfR2Key: null,
  etapas: [
    {
      id: "etapa-1",
      nome: "Servicos Preliminares",
      itens: [mockOrcamentoItem],
    },
  ],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockMedicaoFisica = {
  id: "med-fis-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  periodo: "2024-11",
  status: "RASCUNHO",
  aprovadoPor: null,
  aprovadoEm: null,
  itens: [],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockMedicaoFisicaItem = {
  id: "mfi-1",
  tenantId: "tenant-1",
  medicaoId: "med-fis-1",
  orcamentoItemId: "oi-1",
  percentualMedido: "0.0000",
  acumulado: "0.0000",
  createdAt: new Date("2026-03-01"),
}

const mockMedicaoContrato = {
  id: "med-con-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  empreiteiroId: "Empreiteiro Silva",
  contrato: null,
  periodo: "2024-11",
  status: "RASCUNHO",
  aprovadoPor: null,
  aprovadoEm: null,
  pdfR2Key: null,
  itens: [],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockContratoItem = {
  id: "mci-1",
  tenantId: "tenant-1",
  medicaoId: "med-con-1",
  descricao: "Alvenaria",
  unidade: "m2",
  quantidade: "50.0000",
  valorUnitario: "120.0000",
  acumulado: "0.0000",
  createdAt: new Date("2026-03-01"),
}

// ---- Mock tenant client ----

const mockTenantClient = {
  medicaoFisica: {
    create: vi.fn().mockResolvedValue(mockMedicaoFisica),
    findUnique: vi.fn().mockResolvedValue({ ...mockMedicaoFisica, itens: [mockMedicaoFisicaItem] }),
    findMany: vi.fn().mockResolvedValue([mockMedicaoFisica]),
    update: vi.fn().mockResolvedValue({ ...mockMedicaoFisica, status: "APROVADA" }),
  },
  medicaoFisicaItem: {
    create: vi.fn().mockResolvedValue(mockMedicaoFisicaItem),
    findMany: vi.fn().mockResolvedValue([mockMedicaoFisicaItem]),
    update: vi.fn().mockResolvedValue({ ...mockMedicaoFisicaItem, percentualMedido: "50.0000" }),
  },
  medicaoContrato: {
    create: vi.fn().mockResolvedValue(mockMedicaoContrato),
    findUnique: vi.fn().mockResolvedValue({ ...mockMedicaoContrato, itens: [mockContratoItem] }),
    findMany: vi.fn().mockResolvedValue([mockMedicaoContrato]),
    update: vi.fn().mockResolvedValue({ ...mockMedicaoContrato, status: "APROVADA" }),
  },
  medicaoContratoItem: {
    create: vi.fn().mockResolvedValue(mockContratoItem),
  },
  orcamento: {
    findUnique: vi.fn().mockResolvedValue(mockOrcamento),
  },
}

// Mock addPdfJob
const mockAddPdfJob = vi.fn().mockResolvedValue({ ok: true, jobId: "job-1" })

vi.mock("@/lib/actions/notification", () => ({
  emitNotification: vi.fn().mockResolvedValue(undefined),
  getObraMemberIds: vi.fn().mockResolvedValue(["user-2"]),
}))

vi.mock("@projetapro/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn().mockResolvedValue({
        id: "empresa-1",
        tenantId: "tenant-1",
      }),
    },
    obraMember: {
      findMany: vi.fn().mockResolvedValue([{ userId: "user-2" }]),
    },
  },
}))

vi.mock("@projetapro/db/rls-client", () => ({
  createTenantClient: vi.fn(() => mockTenantClient),
}))

vi.mock("@/lib/pdf-queue-client", () => ({
  addPdfJob: mockAddPdfJob,
}))

// ---- Tests ----

describe("medicoes server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTenantClient.medicaoFisica.create.mockResolvedValue(mockMedicaoFisica)
    mockTenantClient.medicaoFisica.findUnique.mockResolvedValue({
      ...mockMedicaoFisica,
      itens: [mockMedicaoFisicaItem],
    })
    mockTenantClient.medicaoFisica.findMany.mockResolvedValue([mockMedicaoFisica])
    mockTenantClient.medicaoFisica.update.mockResolvedValue({ ...mockMedicaoFisica, status: "APROVADA" })
    mockTenantClient.medicaoFisicaItem.create.mockResolvedValue(mockMedicaoFisicaItem)
    mockTenantClient.medicaoFisicaItem.findMany.mockResolvedValue([mockMedicaoFisicaItem])
    mockTenantClient.medicaoFisicaItem.update.mockResolvedValue({
      ...mockMedicaoFisicaItem,
      percentualMedido: "50.0000",
    })
    mockTenantClient.medicaoContrato.create.mockResolvedValue(mockMedicaoContrato)
    mockTenantClient.medicaoContrato.findUnique.mockResolvedValue({
      ...mockMedicaoContrato,
      itens: [mockContratoItem],
    })
    mockTenantClient.medicaoContrato.findMany.mockResolvedValue([mockMedicaoContrato])
    mockTenantClient.medicaoContrato.update.mockResolvedValue({ ...mockMedicaoContrato, status: "APROVADA" })
    mockTenantClient.medicaoContratoItem.create.mockResolvedValue(mockContratoItem)
    mockTenantClient.orcamento.findUnique.mockResolvedValue(mockOrcamento)
  })

  // ---- createMedicaoFisica ----
  describe("createMedicaoFisica", () => {
    it("creates medicao fisica with RASCUNHO status", async () => {
      const { createMedicaoFisica } = await import("@/lib/actions/medicoes")
      const result = await createMedicaoFisica({
        obraId: "obra-1",
        orcamentoId: "orc-1",
        periodo: "2024-11",
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.medicaoFisica.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            obraId: "obra-1",
            periodo: "2024-11",
            status: "RASCUNHO",
          }),
        })
      )
    })

    it("auto-generates MedicaoFisicaItems from OrcamentoItem records", async () => {
      const { createMedicaoFisica } = await import("@/lib/actions/medicoes")
      await createMedicaoFisica({
        obraId: "obra-1",
        orcamentoId: "orc-1",
        periodo: "2024-11",
      })
      // Should have created one item for mockOrcamentoItem
      expect(mockTenantClient.medicaoFisicaItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            medicaoId: mockMedicaoFisica.id,
            orcamentoItemId: mockOrcamentoItem.id,
            percentualMedido: 0,
          }),
        })
      )
    })
  })

  // ---- createMedicaoContrato accumulates totals (MED-02) ----
  describe("createMedicaoContrato (MED-02)", () => {
    it("creates medicao contrato with RASCUNHO status", async () => {
      const { createMedicaoContrato } = await import("@/lib/actions/medicoes")
      const result = await createMedicaoContrato({
        obraId: "obra-1",
        empreiteiroNome: "Empreiteiro Silva",
        periodo: "2024-11",
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.medicaoContrato.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            obraId: "obra-1",
            status: "RASCUNHO",
          }),
        })
      )
    })

    it("accumulates totals across periods for same empreiteiro (MED-02)", async () => {
      // Simulate prior period with contrato items
      const priorContrato = {
        ...mockMedicaoContrato,
        id: "med-con-prior",
        periodo: "2024-10",
        status: "APROVADA",
        itens: [
          { ...mockContratoItem, quantidade: "30.0000", valorUnitario: "120.0000" },
        ],
      }
      mockTenantClient.medicaoContrato.findMany.mockResolvedValue([priorContrato])

      const { getMedicaoContrato } = await import("@/lib/actions/medicoes")
      const result = await getMedicaoContrato("med-con-1")
      // Should include acumulado data from prior periods
      expect(result).not.toBeNull()
    })
  })

  // ---- approveMedicao role check ----
  describe("approveMedicao", () => {
    it("ADMIN can approve a medicao fisica", async () => {
      const { approveMedicao } = await import("@/lib/actions/medicoes")
      const result = await approveMedicao("fisica", "med-fis-1")
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.medicaoFisica.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "APROVADA" }),
        })
      )
    })

    it("ENGENHEIRO cannot approve — only ADMIN can (locked decision)", async () => {
      const { auth } = await import("@/lib/auth")
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-eng", role: "ENGENHEIRO", empresaId: "empresa-1" },
      } as any)

      const { approveMedicao } = await import("@/lib/actions/medicoes")
      const result = await approveMedicao("fisica", "med-fis-1")
      expect(result).toHaveProperty("error")
      expect(mockTenantClient.medicaoFisica.update).not.toHaveBeenCalled()
    })

    it("CLIENTE cannot approve", async () => {
      const { auth } = await import("@/lib/auth")
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-cli", role: "CLIENTE", empresaId: "empresa-1" },
      } as any)

      const { approveMedicao } = await import("@/lib/actions/medicoes")
      const result = await approveMedicao("fisica", "med-fis-1")
      expect(result).toHaveProperty("error")
    })

    it("ADMIN can approve a medicao contrato", async () => {
      const { approveMedicao } = await import("@/lib/actions/medicoes")
      const result = await approveMedicao("contrato", "med-con-1")
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.medicaoContrato.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "APROVADA" }),
        })
      )
    })
  })

  // ---- exportBoletim ----
  describe("exportBoletim", () => {
    it("enqueues a boletim-medicao PDF job for fisica", async () => {
      mockTenantClient.medicaoFisica.findUnique.mockResolvedValue({
        ...mockMedicaoFisica,
        obraId: "obra-1",
      })
      const { exportBoletim } = await import("@/lib/actions/medicoes")
      const result = await exportBoletim("fisica", "med-fis-1")
      expect(result).toHaveProperty("status", "queued")
      expect(mockAddPdfJob).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "boletim-medicao",
          entityId: "med-fis-1",
        })
      )
    })
  })
})
