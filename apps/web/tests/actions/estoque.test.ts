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

const mockDeposito = {
  id: "dep-1",
  tenantId: "tenant-1",
  obraId: "obra-1",
  nome: "Almoxarifado Principal",
  tipo: "almoxarifado",
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockPedidoItem = {
  id: "item-1",
  tenantId: "tenant-1",
  pedidoId: "ped-1",
  requisicaoId: "req-1",
  descricao: "Cimento CP-II",
  unidade: "sc",
  quantidade: "100.0000",
  precoUnitario: "35.0000",
  createdAt: new Date("2026-03-01"),
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
  itens: [mockPedidoItem],
  createdAt: new Date("2026-03-01"),
  updatedAt: new Date("2026-03-01"),
}

const mockPedidoEntregue = {
  ...mockPedido,
  status: "ENTREGUE",
}

const mockMovimentacao = {
  id: "mov-1",
  tenantId: "tenant-1",
  depositoId: "dep-1",
  pedidoId: null,
  origemId: null,
  destinoId: null,
  tipo: "ENTRADA",
  descricao: "Cimento CP-II",
  unidade: "sc",
  quantidade: "100.0000",
  custoUnitario: null,
  etapaDestino: null,
  registradoPor: "user-1",
  createdAt: new Date("2026-03-01"),
}

// ---- Mock tenant client ----

const mockTenantClient = {
  deposito: {
    create: vi.fn().mockResolvedValue(mockDeposito),
    findMany: vi.fn().mockResolvedValue([mockDeposito]),
    findFirst: vi.fn().mockResolvedValue(mockDeposito),
    findUnique: vi.fn().mockResolvedValue(mockDeposito),
  },
  movimentacaoEstoque: {
    create: vi.fn().mockResolvedValue(mockMovimentacao),
    findMany: vi.fn().mockResolvedValue([mockMovimentacao]),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  compraPedido: {
    findUnique: vi.fn().mockResolvedValue(mockPedido),
    update: vi.fn().mockResolvedValue(mockPedidoEntregue),
  },
  compraRequisicao: {
    update: vi.fn().mockResolvedValue({ id: "req-1", status: "ENTREGUE" }),
  },
  obraMember: {
    findMany: vi.fn().mockResolvedValue([{ userId: "user-2" }]),
  },
}

const mockPrismaTransaction = vi.fn()

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
      findMany: vi.fn().mockResolvedValue([
        { userId: "user-2", role: "ADMIN" },
        { userId: "user-3", role: "ENGENHEIRO" },
      ]),
    },
    $transaction: mockPrismaTransaction,
  },
}))

vi.mock("@projetapro/db/rls-client", () => ({
  createTenantClient: vi.fn(() => mockTenantClient),
}))

describe("estoque server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockTenantClient.deposito.create.mockResolvedValue(mockDeposito)
    mockTenantClient.deposito.findMany.mockResolvedValue([mockDeposito])
    mockTenantClient.deposito.findFirst.mockResolvedValue(mockDeposito)
    mockTenantClient.deposito.findUnique.mockResolvedValue(mockDeposito)
    mockTenantClient.movimentacaoEstoque.create.mockResolvedValue(mockMovimentacao)
    mockTenantClient.movimentacaoEstoque.findMany.mockResolvedValue([mockMovimentacao])
    mockTenantClient.compraPedido.findUnique.mockResolvedValue(mockPedido)
    mockTenantClient.compraPedido.update.mockResolvedValue(mockPedidoEntregue)
    mockTenantClient.compraRequisicao.update.mockResolvedValue({ id: "req-1", status: "ENTREGUE" })
    mockPrismaTransaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
      // Simulate transaction by calling the callback with a tx that delegates to tenant client
      const tx = {
        compraPedido: mockTenantClient.compraPedido,
        compraRequisicao: mockTenantClient.compraRequisicao,
        movimentacaoEstoque: mockTenantClient.movimentacaoEstoque,
        deposito: mockTenantClient.deposito,
      }
      return fn(tx)
    })
  })

  // ---- COMP-05: deliverPedido creates ENTRADA ----
  describe("deliverPedido", () => {
    it("creates ENTRADA movimentacao when pedido is delivered (COMP-05)", async () => {
      const { deliverPedido } = await import("@/lib/actions/estoque")
      const result = await deliverPedido("ped-1")
      expect(result).toHaveProperty("success", true)
      // Must update pedido status to ENTREGUE
      expect(mockTenantClient.compraPedido.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ped-1" },
          data: expect.objectContaining({ status: "ENTREGUE" }),
        })
      )
      // Must create an ENTRADA movimentacao
      expect(mockTenantClient.movimentacaoEstoque.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: "ENTRADA",
            pedidoId: "ped-1",
          }),
        })
      )
    })

    it("returns error when pedido is already ENTREGUE", async () => {
      mockTenantClient.compraPedido.findUnique.mockResolvedValueOnce(mockPedidoEntregue)
      const { deliverPedido } = await import("@/lib/actions/estoque")
      const result = await deliverPedido("ped-1")
      expect(result).toHaveProperty("error")
      expect(mockTenantClient.compraPedido.update).not.toHaveBeenCalled()
    })
  })

  // ---- addMovimentacao SAIDA insufficient stock ----
  describe("addMovimentacao", () => {
    it("returns error for SAIDA with insufficient stock", async () => {
      // findMany returns an ENTRADA of 10 units
      mockTenantClient.movimentacaoEstoque.findMany.mockResolvedValueOnce([
        { ...mockMovimentacao, tipo: "ENTRADA", quantidade: "10.0000" },
      ])
      const { addMovimentacao } = await import("@/lib/actions/estoque")
      const result = await addMovimentacao({
        depositoId: "dep-1",
        tipo: "SAIDA",
        descricao: "Cimento CP-II",
        unidade: "sc",
        quantidade: 50, // exceeds saldo of 10
      })
      expect(result).toHaveProperty("error", "Estoque insuficiente")
    })

    it("allows SAIDA when stock is sufficient", async () => {
      // findMany returns ENTRADA of 100 units
      mockTenantClient.movimentacaoEstoque.findMany.mockResolvedValueOnce([
        { ...mockMovimentacao, tipo: "ENTRADA", quantidade: "100.0000" },
      ])
      mockPrismaTransaction.mockImplementationOnce(async (fn: (tx: any) => Promise<any>) => {
        const tx = {
          movimentacaoEstoque: {
            findMany: vi.fn().mockResolvedValue([
              { ...mockMovimentacao, tipo: "ENTRADA", quantidade: "100.0000" },
            ]),
            create: vi.fn().mockResolvedValue({ ...mockMovimentacao, tipo: "SAIDA" }),
          },
        }
        return fn(tx)
      })
      const { addMovimentacao } = await import("@/lib/actions/estoque")
      const result = await addMovimentacao({
        depositoId: "dep-1",
        tipo: "SAIDA",
        descricao: "Cimento CP-II",
        unidade: "sc",
        quantidade: 50,
      })
      // Should succeed (no error)
      expect(result).not.toHaveProperty("error", "Estoque insuficiente")
    })
  })
})
