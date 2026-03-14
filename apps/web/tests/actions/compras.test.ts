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

const mockFornecedor = {
  id: "forn-1",
  tenantId: "tenant-1",
  empresaId: "empresa-1",
  nome: "Fornecedor Teste",
  cnpj: "12.345.678/0001-99",
  contato: "Jose",
  email: "jose@teste.com",
  telefone: "11999999999",
  categorias: ["materiais"],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockRequisicao = {
  id: "req-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  orcamentoItemId: "item-orc-1",
  descricao: "Cimento CP-II",
  unidade: "sc",
  quantidade: "100.0000",
  status: "PENDENTE",
  solicitanteId: "user-1",
  aprovadorId: null,
  aprovadoEm: null,
  cotacoes: [],
  pedidoItens: [],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockCotacao = {
  id: "cot-1",
  tenantId: "tenant-1",
  requisicaoId: "req-1",
  fornecedorId: "forn-1",
  precoUnitario: "35.0000",
  prazoEntrega: 7,
  observacoes: null,
  selecionada: false,
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockPedido = {
  id: "ped-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  fornecedorId: "forn-1",
  status: "RASCUNHO",
  totalEstimado: "3500.0000",
  observacoes: null,
  pdfR2Key: null,
  itens: [],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

// ---- Mock tenant client ----

const mockTenantClient = {
  compraRequisicao: {
    create: vi.fn().mockResolvedValue(mockRequisicao),
    findUnique: vi.fn().mockResolvedValue(mockRequisicao),
    update: vi.fn().mockResolvedValue({ ...mockRequisicao, status: "APROVADA" }),
    findMany: vi.fn().mockResolvedValue([mockRequisicao]),
  },
  compraCotacao: {
    create: vi.fn().mockResolvedValue(mockCotacao),
    findMany: vi.fn().mockResolvedValue([mockCotacao]),
  },
  compraPedido: {
    create: vi.fn().mockResolvedValue(mockPedido),
    findUnique: vi.fn().mockResolvedValue(mockPedido),
    update: vi.fn().mockResolvedValue({ ...mockPedido, status: "ENVIADO" }),
  },
  fornecedor: {
    create: vi.fn().mockResolvedValue(mockFornecedor),
    findMany: vi.fn().mockResolvedValue([mockFornecedor]),
    findUnique: vi.fn().mockResolvedValue(mockFornecedor),
    update: vi.fn().mockResolvedValue(mockFornecedor),
    delete: vi.fn().mockResolvedValue(mockFornecedor),
    count: vi.fn().mockResolvedValue(0),
  },
}

// Mock addPdfJob
const mockAddPdfJob = vi.fn().mockResolvedValue({ id: "job-1" })

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

// Mock the pdf queue
vi.mock("@/lib/pdf-queue-client", () => ({
  addPdfJob: mockAddPdfJob,
}))

describe("compras server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockTenantClient.compraRequisicao.create.mockResolvedValue(mockRequisicao)
    mockTenantClient.compraRequisicao.findUnique.mockResolvedValue(mockRequisicao)
    mockTenantClient.compraRequisicao.update.mockResolvedValue({ ...mockRequisicao, status: "APROVADA" })
    mockTenantClient.compraRequisicao.findMany.mockResolvedValue([mockRequisicao])
    mockTenantClient.compraCotacao.create.mockResolvedValue(mockCotacao)
    mockTenantClient.compraCotacao.findMany.mockResolvedValue([mockCotacao])
    mockTenantClient.compraPedido.create.mockResolvedValue(mockPedido)
    mockTenantClient.compraPedido.findUnique.mockResolvedValue(mockPedido)
    mockTenantClient.fornecedor.create.mockResolvedValue(mockFornecedor)
    mockTenantClient.fornecedor.findMany.mockResolvedValue([mockFornecedor])
    mockTenantClient.fornecedor.count.mockResolvedValue(0)
  })

  // ---- COMP-01: createRequisicao links orcamentoItemId ----
  describe("createRequisicao", () => {
    it("creates requisicao with status PENDENTE", async () => {
      const { createRequisicao } = await import("@/lib/actions/compras")
      const result = await createRequisicao({
        obraId: "obra-1",
        descricao: "Cimento CP-II",
        quantidade: 100,
        unidade: "sc",
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.compraRequisicao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            obraId: "obra-1",
            descricao: "Cimento CP-II",
            status: "PENDENTE",
          }),
        })
      )
    })

    it("links orcamentoItemId when provided (COMP-01)", async () => {
      const { createRequisicao } = await import("@/lib/actions/compras")
      const result = await createRequisicao({
        obraId: "obra-1",
        descricao: "Cimento CP-II",
        quantidade: 100,
        unidade: "sc",
        orcamentoItemId: "item-orc-1",
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.compraRequisicao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orcamentoItemId: "item-orc-1",
          }),
        })
      )
    })

    it("does not set orcamentoItemId when not provided", async () => {
      const { createRequisicao } = await import("@/lib/actions/compras")
      await createRequisicao({
        obraId: "obra-1",
        descricao: "Cimento",
        quantidade: 10,
        unidade: "sc",
      })
      const callArg = mockTenantClient.compraRequisicao.create.mock.calls[0][0]
      // orcamentoItemId should be null or undefined (not linked)
      expect(callArg.data.orcamentoItemId == null).toBe(true)
    })

    it("returns error for missing descricao", async () => {
      const { createRequisicao } = await import("@/lib/actions/compras")
      const result = await createRequisicao({
        obraId: "obra-1",
        descricao: "",
        quantidade: 100,
        unidade: "sc",
      })
      expect(result).toHaveProperty("error")
    })
  })

  // ---- COMP-02: approveRequisicao role check ----
  describe("approveRequisicao", () => {
    it("ADMIN can approve a pending requisicao", async () => {
      // auth returns ADMIN by default
      const { approveRequisicao } = await import("@/lib/actions/compras")
      const result = await approveRequisicao("req-1")
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.compraRequisicao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "req-1" },
          data: expect.objectContaining({ status: "APROVADA" }),
        })
      )
    })

    it("ENGENHEIRO can approve a requisicao", async () => {
      const { auth } = await import("@/lib/auth")
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-eng", role: "ENGENHEIRO", empresaId: "empresa-1" },
      } as any)

      const { approveRequisicao } = await import("@/lib/actions/compras")
      const result = await approveRequisicao("req-1")
      expect(result).toHaveProperty("success", true)
    })

    it("CLIENTE cannot approve — returns error (COMP-02)", async () => {
      const { auth } = await import("@/lib/auth")
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-cli", role: "CLIENTE", empresaId: "empresa-1" },
      } as any)

      const { approveRequisicao } = await import("@/lib/actions/compras")
      const result = await approveRequisicao("req-1")
      expect(result).toHaveProperty("error")
      expect(mockTenantClient.compraRequisicao.update).not.toHaveBeenCalled()
    })
  })

  // ---- COMP-04: createPedido enqueues PDF job ----
  describe("createPedido", () => {
    it("creates pedido with status RASCUNHO", async () => {
      const { createPedido } = await import("@/lib/actions/compras")
      const result = await createPedido({
        obraId: "obra-1",
        fornecedorId: "forn-1",
        itens: [
          { requisicaoId: "req-1", descricao: "Cimento", unidade: "sc", quantidade: 100, precoUnitario: 35 },
        ],
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.compraPedido.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fornecedorId: "forn-1",
            status: "RASCUNHO",
          }),
        })
      )
    })

    it("enqueues a pedido-compra PDF job (COMP-04)", async () => {
      const { createPedido } = await import("@/lib/actions/compras")
      await createPedido({
        obraId: "obra-1",
        fornecedorId: "forn-1",
        itens: [
          { requisicaoId: "req-1", descricao: "Cimento", unidade: "sc", quantidade: 100, precoUnitario: 35 },
        ],
      })
      expect(mockAddPdfJob).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "pedido-compra",
          entityId: mockPedido.id,
          obraId: "obra-1",
        })
      )
    })
  })

  // ---- COMP-06: createFornecedor scoped to empresaId ----
  describe("createFornecedor", () => {
    it("scopes fornecedor to empresaId (COMP-06)", async () => {
      const { createFornecedor } = await import("@/lib/actions/fornecedor")
      const result = await createFornecedor({
        nome: "Cimento Ltda",
        categorias: ["materiais"],
      })
      expect(result).toHaveProperty("success", true)
      expect(mockTenantClient.fornecedor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            empresaId: "empresa-1",
          }),
        })
      )
    })

    it("does not include obraId in fornecedor creation (COMP-06)", async () => {
      const { createFornecedor } = await import("@/lib/actions/fornecedor")
      await createFornecedor({
        nome: "Cimento Ltda",
        categorias: [],
      })
      const callArg = mockTenantClient.fornecedor.create.mock.calls[0][0]
      expect(callArg.data).not.toHaveProperty("obraId")
    })

    it("returns error for missing nome", async () => {
      const { createFornecedor } = await import("@/lib/actions/fornecedor")
      const result = await createFornecedor({ nome: "", categorias: [] })
      expect(result).toHaveProperty("error")
    })
  })
})
