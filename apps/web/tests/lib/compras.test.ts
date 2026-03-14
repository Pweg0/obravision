import { describe, it, expect } from "vitest"
import { buildMapa } from "@/lib/compras-utils"

// --- Types for test data ---
interface RequisicaoItem {
  id: string
  descricao: string
  quantidade: number | string
  unidade: string
}

interface Cotacao {
  id: string
  requisicaoId: string
  fornecedorId: string
  precoUnitario: number | string
  prazoEntrega?: number | null
}

describe("buildMapa", () => {
  const item1: RequisicaoItem = { id: "req-1", descricao: "Cimento CP-II", quantidade: 100, unidade: "sc" }
  const item2: RequisicaoItem = { id: "req-2", descricao: "Areia grossa", quantidade: 5, unidade: "m3" }
  const item3: RequisicaoItem = { id: "req-3", descricao: "Pedra brita", quantidade: 3, unidade: "m3" }

  const cotacoesForn1: Cotacao[] = [
    { id: "cot-1a", requisicaoId: "req-1", fornecedorId: "forn-1", precoUnitario: 35 },
    { id: "cot-1b", requisicaoId: "req-2", fornecedorId: "forn-1", precoUnitario: 120 },
    { id: "cot-1c", requisicaoId: "req-3", fornecedorId: "forn-1", precoUnitario: 90 },
  ]

  const cotacoesForn2: Cotacao[] = [
    { id: "cot-2a", requisicaoId: "req-1", fornecedorId: "forn-2", precoUnitario: 32 },
    { id: "cot-2b", requisicaoId: "req-2", fornecedorId: "forn-2", precoUnitario: 130 },
    { id: "cot-2c", requisicaoId: "req-3", fornecedorId: "forn-2", precoUnitario: 85 },
  ]

  it("returns 3 rows for 3 items with 2 suppliers", () => {
    const items = [item1, item2, item3]
    const cotacoes = [...cotacoesForn1, ...cotacoesForn2]
    const result = buildMapa(items, cotacoes)

    expect(result).toHaveLength(3)
  })

  it("each row has precos record keyed by fornecedorId", () => {
    const items = [item1, item2, item3]
    const cotacoes = [...cotacoesForn1, ...cotacoesForn2]
    const result = buildMapa(items, cotacoes)

    expect(result[0].precos).toHaveProperty("forn-1")
    expect(result[0].precos).toHaveProperty("forn-2")
  })

  it("highlights menorPreco correctly (forn-2 is cheaper for all 3)", () => {
    const items = [item1, item2, item3]
    const cotacoes = [...cotacoesForn1, ...cotacoesForn2]
    const result = buildMapa(items, cotacoes)

    // forn-2: 32 vs forn-1: 35 -> forn-2 wins
    expect(result[0].menorPreco).toBe(32)
    expect(result[0].melhorFornecedorId).toBe("forn-2")

    // forn-1: 120 vs forn-2: 130 -> forn-1 wins
    expect(result[1].menorPreco).toBe(120)
    expect(result[1].melhorFornecedorId).toBe("forn-1")

    // forn-2: 85 vs forn-1: 90 -> forn-2 wins
    expect(result[2].menorPreco).toBe(85)
    expect(result[2].melhorFornecedorId).toBe("forn-2")
  })

  it("returns items with empty precos and null menorPreco when no cotacoes", () => {
    const items = [item1, item2]
    const result = buildMapa(items, [])

    expect(result).toHaveLength(2)
    expect(result[0].precos).toEqual({})
    expect(result[0].menorPreco).toBeNull()
    expect(result[0].melhorFornecedorId).toBeNull()
    expect(result[1].precos).toEqual({})
    expect(result[1].menorPreco).toBeNull()
  })

  it("single supplier: price is lowest (and thus menorPreco)", () => {
    const items = [item1]
    const cotacoes: Cotacao[] = [
      { id: "cot-1", requisicaoId: "req-1", fornecedorId: "forn-1", precoUnitario: 35 },
    ]
    const result = buildMapa(items, cotacoes)

    expect(result).toHaveLength(1)
    expect(result[0].menorPreco).toBe(35)
    expect(result[0].melhorFornecedorId).toBe("forn-1")
    expect(Object.keys(result[0].precos)).toHaveLength(1)
  })

  it("handles Decimal-like string prices", () => {
    const items = [item1]
    const cotacoes = [
      { id: "cot-a", requisicaoId: "req-1", fornecedorId: "forn-1", precoUnitario: "35.0000" as unknown as number },
      { id: "cot-b", requisicaoId: "req-1", fornecedorId: "forn-2", precoUnitario: "32.5000" as unknown as number },
    ]
    const result = buildMapa(items, cotacoes)

    expect(result[0].menorPreco).toBeCloseTo(32.5)
    expect(result[0].melhorFornecedorId).toBe("forn-2")
  })

  it("row includes descricao, quantidade, unidade from requisicao item", () => {
    const items = [item1]
    const cotacoes: Cotacao[] = [
      { id: "cot-1", requisicaoId: "req-1", fornecedorId: "forn-1", precoUnitario: 35 },
    ]
    const result = buildMapa(items, cotacoes)

    expect(result[0].requisicaoId).toBe("req-1")
    expect(result[0].descricao).toBe("Cimento CP-II")
    expect(result[0].quantidade).toBe(100)
    expect(result[0].unidade).toBe("sc")
  })
})
