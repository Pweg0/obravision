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
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}))

// Mock tenant client factory
const mockEtapa = {
  id: "etapa-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  nome: "Fundacao",
  ordem: 1,
  climaSensivel: false,
  tarefas: [],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockTarefa = {
  id: "tarefa-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  etapaId: "etapa-1",
  nome: "Concretagem",
  responsavelId: "user-1",
  status: "PENDENTE" as const,
  startDate: new Date("2026-03-10"),
  endDate: new Date("2026-03-20"),
  climaSensivel: null,
  progressoReal: 0,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockTenantClient = {
  etapa: {
    create: vi.fn().mockResolvedValue(mockEtapa),
    findUnique: vi.fn().mockResolvedValue({ ...mockEtapa, tarefas: [] }),
    update: vi.fn().mockResolvedValue(mockEtapa),
    delete: vi.fn().mockResolvedValue(mockEtapa),
    findMany: vi.fn().mockResolvedValue([]),
  },
  tarefa: {
    create: vi.fn().mockResolvedValue(mockTarefa),
    findUnique: vi.fn().mockResolvedValue(mockTarefa),
    update: vi.fn().mockResolvedValue(mockTarefa),
    delete: vi.fn().mockResolvedValue(mockTarefa),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  },
}

vi.mock("@obravision/db/rls-client", () => ({
  createTenantClient: vi.fn(() => mockTenantClient),
}))

// Import actions after mocks
import {
  createEtapa,
  updateEtapa,
  deleteEtapa,
  createTarefa,
  updateTarefa,
  updateTarefaDates,
  deleteTarefa,
  listCronograma,
} from "@/lib/actions/cronograma"

import { auth } from "@/lib/auth"

describe("cronograma actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth mock to ADMIN by default
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "ADMIN", empresaId: "empresa-1" },
    } as never)
    // Reset tenant client mocks
    mockTenantClient.etapa.create.mockResolvedValue(mockEtapa)
    mockTenantClient.etapa.findUnique.mockResolvedValue({ ...mockEtapa, tarefas: [] })
    mockTenantClient.etapa.update.mockResolvedValue(mockEtapa)
    mockTenantClient.etapa.delete.mockResolvedValue(mockEtapa)
    mockTenantClient.tarefa.create.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.findUnique.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.update.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.delete.mockResolvedValue(mockTarefa)
    mockTenantClient.tarefa.count.mockResolvedValue(0)
  })

  // ---- createEtapa ----

  describe("createEtapa", () => {
    it("creates an etapa for ADMIN user", async () => {
      const result = await createEtapa({
        obraId: "obra-1",
        nome: "Fundacao",
        ordem: 1,
      })
      expect(result).toEqual({ success: true, etapa: mockEtapa })
      expect(mockTenantClient.etapa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            obraId: "obra-1",
            nome: "Fundacao",
            ordem: 1,
          }),
        })
      )
    })

    it("creates an etapa for ENGENHEIRO user", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-2", role: "ENGENHEIRO", empresaId: "empresa-1" },
      } as never)
      const result = await createEtapa({ obraId: "obra-1", nome: "Alvenaria", ordem: 2 })
      expect(result).toEqual({ success: true, etapa: mockEtapa })
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await createEtapa({ obraId: "obra-1", nome: "Fundacao", ordem: 1 })
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
      expect(mockTenantClient.etapa.create).not.toHaveBeenCalled()
    })

    it("returns error for missing nome", async () => {
      const result = await createEtapa({ obraId: "obra-1", nome: "", ordem: 1 })
      expect(result).toHaveProperty("error")
    })

    it("returns error for invalid ordem (negative)", async () => {
      const result = await createEtapa({ obraId: "obra-1", nome: "Test", ordem: -1 })
      expect(result).toHaveProperty("error")
    })
  })

  // ---- updateEtapa ----

  describe("updateEtapa", () => {
    it("updates an etapa for ADMIN", async () => {
      const result = await updateEtapa("etapa-1", { nome: "Fundacao Atualizada" })
      expect(result).toEqual({ success: true, etapa: mockEtapa })
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await updateEtapa("etapa-1", { nome: "Updated" })
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
    })
  })

  // ---- deleteEtapa ----

  describe("deleteEtapa", () => {
    it("deletes an etapa with no tarefas", async () => {
      mockTenantClient.tarefa.count.mockResolvedValueOnce(0)
      const result = await deleteEtapa("etapa-1")
      expect(result).toEqual({ success: true })
    })

    it("refuses to delete an etapa with existing tarefas", async () => {
      mockTenantClient.tarefa.count.mockResolvedValueOnce(3)
      const result = await deleteEtapa("etapa-1")
      expect(result).toEqual({ error: expect.stringContaining("tarefa") })
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await deleteEtapa("etapa-1")
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
    })
  })

  // ---- createTarefa ----

  describe("createTarefa", () => {
    const validInput = {
      etapaId: "etapa-1",
      obraId: "obra-1",
      nome: "Concretagem",
      startDate: new Date("2026-03-10"),
      endDate: new Date("2026-03-20"),
    }

    it("creates a tarefa for ADMIN user", async () => {
      const result = await createTarefa(validInput)
      expect(result).toEqual({ success: true, tarefa: mockTarefa })
      expect(mockTenantClient.tarefa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            etapaId: "etapa-1",
            nome: "Concretagem",
            status: "PENDENTE",
          }),
        })
      )
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await createTarefa(validInput)
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
      expect(mockTenantClient.tarefa.create).not.toHaveBeenCalled()
    })

    it("returns error when endDate is before startDate", async () => {
      const result = await createTarefa({
        ...validInput,
        startDate: new Date("2026-03-20"),
        endDate: new Date("2026-03-10"),
      })
      expect(result).toHaveProperty("error")
    })

    it("returns error for missing nome", async () => {
      const result = await createTarefa({ ...validInput, nome: "" })
      expect(result).toHaveProperty("error")
    })
  })

  // ---- updateTarefa ----

  describe("updateTarefa", () => {
    it("updates a tarefa status for ADMIN", async () => {
      const result = await updateTarefa("tarefa-1", { status: "EM_ANDAMENTO" })
      expect(result).toEqual({ success: true, tarefa: mockTarefa })
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await updateTarefa("tarefa-1", { status: "EM_ANDAMENTO" })
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
    })
  })

  // ---- updateTarefaDates ----

  describe("updateTarefaDates", () => {
    const validDates = {
      startDate: new Date("2026-03-10"),
      endDate: new Date("2026-03-20"),
    }

    it("updates tarefa dates for ADMIN (Gantt drag)", async () => {
      const result = await updateTarefaDates("tarefa-1", validDates)
      expect(result).toEqual({ success: true, tarefa: mockTarefa })
      expect(mockTenantClient.tarefa.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tarefa-1" },
          data: expect.objectContaining({
            startDate: validDates.startDate,
            endDate: validDates.endDate,
          }),
        })
      )
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await updateTarefaDates("tarefa-1", validDates)
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
    })

    it("returns error when endDate is before startDate", async () => {
      const result = await updateTarefaDates("tarefa-1", {
        startDate: new Date("2026-03-20"),
        endDate: new Date("2026-03-10"),
      })
      expect(result).toHaveProperty("error")
    })
  })

  // ---- deleteTarefa ----

  describe("deleteTarefa", () => {
    it("deletes a tarefa for ADMIN", async () => {
      const result = await deleteTarefa("tarefa-1")
      expect(result).toEqual({ success: true })
    })

    it("rejects CLIENTE role", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-3", role: "CLIENTE", empresaId: "empresa-1" },
      } as never)
      const result = await deleteTarefa("tarefa-1")
      expect(result).toEqual({ error: expect.stringContaining("Permissao") })
    })
  })

  // ---- listCronograma ----

  describe("listCronograma", () => {
    it("returns etapas with nested tarefas ordered by ordem then startDate", async () => {
      const etapaWithTarefas = {
        ...mockEtapa,
        tarefas: [mockTarefa],
      }
      mockTenantClient.etapa.findMany.mockResolvedValueOnce([etapaWithTarefas])

      const result = await listCronograma("obra-1")
      // listCronograma adds temAlertaChuva to each tarefa — use objectContaining to ignore that field
      expect(result).toEqual([
        expect.objectContaining({
          ...etapaWithTarefas,
          tarefas: [
            expect.objectContaining(mockTarefa),
          ],
        }),
      ])
      expect(mockTenantClient.etapa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { obraId: "obra-1" },
          include: expect.objectContaining({
            tarefas: expect.objectContaining({
              orderBy: { startDate: "asc" },
            }),
          }),
          orderBy: { ordem: "asc" },
        })
      )
    })

    it("returns empty array when no etapas", async () => {
      mockTenantClient.etapa.findMany.mockResolvedValueOnce([])
      const result = await listCronograma("obra-1")
      expect(result).toEqual([])
    })
  })
})
