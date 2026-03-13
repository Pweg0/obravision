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

// Mock @obravision/db (prisma singleton)
vi.mock("@obravision/db", () => ({
  prisma: {
    empresa: {
      findUnique: vi.fn().mockResolvedValue({
        id: "empresa-1",
        tenantId: "tenant-1",
      }),
    },
  },
}))

// ---- Shared mock data ----

const mockTarefa = {
  id: "tarefa-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  etapaId: "etapa-1",
  nome: "Concretagem",
  status: "EM_ANDAMENTO" as const,
  startDate: new Date("2026-03-01"),
  endDate: new Date("2026-03-20"),
  progressoReal: 0,
  climaSensivel: null,
  responsavelId: null,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockRdoEntrada = {
  id: "rdo-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  tarefaId: "tarefa-1",
  autorId: "user-1",
  data: new Date("2026-03-10"),
  texto: "Concretagem executada sem intercorrencias",
  maoDeObra: null,
  materiais: null,
  ocorrencias: null,
  climaCondicao: "Ensolarado",
  climaTemp: 28.0,
  climaUmidade: 65.0,
  climaFonteDado: "open-meteo",
  fotos: [],
  createdAt: new Date("2026-03-10"),
  updatedAt: new Date("2026-03-10"),
}

// Mock tenant client factory
const mockTenantClient = {
  rdoEntrada: {
    create: vi.fn().mockResolvedValue(mockRdoEntrada),
    findMany: vi.fn().mockResolvedValue([mockRdoEntrada]),
    findFirst: vi.fn().mockResolvedValue(mockRdoEntrada),
    findUnique: vi.fn().mockResolvedValue(mockRdoEntrada),
    count: vi.fn().mockResolvedValue(1),
  },
  rdoFoto: {
    create: vi.fn().mockResolvedValue({
      id: "foto-1",
      tenantId: "tenant-1",
      rdoEntradaId: "rdo-1",
      r2Key: "rdo/tenant-1/rdo-1/abc-photo.jpg",
      legenda: "Vista geral",
      ordem: 0,
      createdAt: new Date("2026-03-10"),
    }),
  },
  tarefa: {
    findFirst: vi.fn().mockResolvedValue(mockTarefa),
    findUnique: vi.fn().mockResolvedValue(mockTarefa),
    update: vi.fn().mockResolvedValue(mockTarefa),
    findMany: vi.fn().mockResolvedValue([mockTarefa]),
  },
}

vi.mock("@obravision/db/rls-client", () => ({
  createTenantClient: vi.fn(() => mockTenantClient),
}))

// Import actions after mocks
import {
  createRdoEntrada,
  getActiveTask,
  calcProgressoReal,
  listRdoEntradas,
} from "@/lib/actions/rdo"

import { auth } from "@/lib/auth"

describe("rdo actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth mock to ADMIN by default
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "ADMIN", empresaId: "empresa-1" },
    } as never)
    // Reset mocks
    mockTenantClient.rdoEntrada.create.mockResolvedValue(mockRdoEntrada)
    mockTenantClient.rdoEntrada.findMany.mockResolvedValue([mockRdoEntrada])
    mockTenantClient.rdoEntrada.findFirst.mockResolvedValue(mockRdoEntrada)
    mockTenantClient.rdoEntrada.count.mockResolvedValue(1)
    mockTenantClient.rdoFoto.create.mockResolvedValue({
      id: "foto-1",
      tenantId: "tenant-1",
      rdoEntradaId: "rdo-1",
      r2Key: "rdo/tenant-1/rdo-1/abc-photo.jpg",
      legenda: null,
      ordem: 0,
      createdAt: new Date("2026-03-10"),
    })
    mockTenantClient.tarefa.findFirst.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.findUnique.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.update.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.findMany.mockResolvedValue([mockTarefa])
  })

  // ---- createRdoEntrada ----

  describe("createRdoEntrada", () => {
    const validInput = {
      obraId: "obra-1",
      data: new Date("2026-03-10"),
      texto: "Concretagem executada",
      tarefaId: "tarefa-1",
      climaCondicao: "Ensolarado",
      climaTemp: 28.0,
      climaUmidade: 65.0,
      climaFonteDado: "open-meteo" as const,
    }

    it("creates an RDO entry for ADMIN user", async () => {
      const result = await createRdoEntrada(validInput)
      expect(result).toEqual({ success: true, entrada: mockRdoEntrada })
      expect(mockTenantClient.rdoEntrada.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            obraId: "obra-1",
            texto: "Concretagem executada",
            tarefaId: "tarefa-1",
          }),
        })
      )
    })

    it("creates an RDO entry for ENGENHEIRO user", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-2", role: "ENGENHEIRO", empresaId: "empresa-1" },
      } as never)
      const result = await createRdoEntrada(validInput)
      expect(result).toEqual({ success: true, entrada: mockRdoEntrada })
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await createRdoEntrada(validInput)
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
      expect(mockTenantClient.rdoEntrada.create).not.toHaveBeenCalled()
    })

    it("recalculates progressoReal on tarefa after creating entry with tarefaId", async () => {
      // Mock count for progress calculation: 3 distinct RDO entries over 10-day task (Mar 1-Mar 10)
      const tarefa10Day = {
        ...mockTarefa,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-10"),
      }
      mockTenantClient.tarefa.findUnique.mockResolvedValueOnce(tarefa10Day)
      mockTenantClient.rdoEntrada.findMany.mockResolvedValueOnce([
        { ...mockRdoEntrada, data: new Date("2026-03-02") },
        { ...mockRdoEntrada, id: "rdo-2", data: new Date("2026-03-05") },
        { ...mockRdoEntrada, id: "rdo-3", data: new Date("2026-03-07") },
      ])

      await createRdoEntrada(validInput)

      // tarefa.update should have been called with progressoReal
      expect(mockTenantClient.tarefa.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tarefa-1" },
          data: expect.objectContaining({
            progressoReal: expect.any(Number),
          }),
        })
      )
    })

    it("returns error for missing obraId", async () => {
      const result = await createRdoEntrada({ ...validInput, obraId: "" })
      expect(result).toHaveProperty("error")
    })

    it("returns error for missing data field", async () => {
      const result = await createRdoEntrada({ ...validInput, data: undefined as unknown as Date })
      expect(result).toHaveProperty("error")
    })
  })

  // ---- getActiveTask ----

  describe("getActiveTask", () => {
    it("returns the EM_ANDAMENTO tarefa covering the given date", async () => {
      const result = await getActiveTask("obra-1", new Date("2026-03-10"))
      expect(result).toEqual(mockTarefa)
      expect(mockTenantClient.tarefa.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            obraId: "obra-1",
            status: "EM_ANDAMENTO",
          }),
        })
      )
    })

    it("returns null when no active task covers the date", async () => {
      mockTenantClient.tarefa.findFirst.mockResolvedValueOnce(null)
      const result = await getActiveTask("obra-1", new Date("2026-03-10"))
      expect(result).toBeNull()
    })

    it("picks earliest startDate when multiple tasks could match", async () => {
      // The query uses orderBy: { startDate: "asc" } and findFirst — so earliest is returned
      const result = await getActiveTask("obra-1", new Date("2026-03-10"))
      expect(mockTenantClient.tarefa.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: "asc" },
        })
      )
      expect(result).toEqual(mockTarefa)
    })
  })

  // ---- calcProgressoReal ----

  describe("calcProgressoReal", () => {
    it("returns 30% for 3 RDO entries in a 10-day task", async () => {
      const tarefa10Day = {
        ...mockTarefa,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-10"),
      }
      mockTenantClient.tarefa.findUnique.mockResolvedValueOnce(tarefa10Day)
      // 3 RDO entries with distinct dates
      mockTenantClient.rdoEntrada.findMany.mockResolvedValueOnce([
        { data: new Date("2026-03-02") },
        { data: new Date("2026-03-05") },
        { data: new Date("2026-03-07") },
      ])

      const result = await calcProgressoReal("tarefa-1")
      expect(result).toBe(30)
    })

    it("returns 0% when there are no RDO entries", async () => {
      mockTenantClient.tarefa.findUnique.mockResolvedValueOnce(mockTarefa)
      mockTenantClient.rdoEntrada.findMany.mockResolvedValueOnce([])

      const result = await calcProgressoReal("tarefa-1")
      expect(result).toBe(0)
    })

    it("caps at 100% even if more entries than planned days", async () => {
      // 5-day task with 10 entries
      const tarefa5Day = {
        ...mockTarefa,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-05"),
      }
      mockTenantClient.tarefa.findUnique.mockResolvedValueOnce(tarefa5Day)
      // 10 entries (more than duration)
      mockTenantClient.rdoEntrada.findMany.mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, i) => ({
          data: new Date(`2026-03-${String(i + 1).padStart(2, "0")}`),
        }))
      )

      const result = await calcProgressoReal("tarefa-1")
      expect(result).toBe(100)
    })

    it("returns 0 when tarefa is not found", async () => {
      mockTenantClient.tarefa.findUnique.mockResolvedValueOnce(null)

      const result = await calcProgressoReal("tarefa-does-not-exist")
      expect(result).toBe(0)
    })
  })

  // ---- listRdoEntradas ----

  describe("listRdoEntradas", () => {
    it("returns all entries for an obra ordered by data desc", async () => {
      const result = await listRdoEntradas("obra-1")
      expect(result).toEqual([mockRdoEntrada])
      expect(mockTenantClient.rdoEntrada.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { obraId: "obra-1" },
          orderBy: { data: "desc" },
        })
      )
    })

    it("returns empty array when no entries", async () => {
      mockTenantClient.rdoEntrada.findMany.mockResolvedValueOnce([])
      const result = await listRdoEntradas("obra-1")
      expect(result).toEqual([])
    })
  })
})
