import { describe, it, expect } from "vitest"
import { calcularPrecoVenda } from "@/lib/orcamento"
import { buildCurvaABC } from "@/lib/orcamento-utils"

describe("calcularPrecoVenda", () => {
  it("returns custo * (1 + bdi/100) for normal values", () => {
    expect(calcularPrecoVenda(100, 25)).toBe(125.0)
  })

  it("returns 0 when custo is 0", () => {
    expect(calcularPrecoVenda(0, 25)).toBe(0)
  })

  it("returns custo unchanged when bdi is 0", () => {
    expect(calcularPrecoVenda(1000, 0)).toBe(1000.0)
  })

  it("handles large numbers correctly", () => {
    expect(calcularPrecoVenda(1000000, 20)).toBe(1200000.0)
  })

  it("handles decimal bdi", () => {
    expect(calcularPrecoVenda(200, 12.5)).toBeCloseTo(225.0, 2)
  })

  it("handles decimal custo", () => {
    expect(calcularPrecoVenda(99.99, 10)).toBeCloseTo(109.989, 2)
  })
})

describe("buildCurvaABC", () => {
  it("returns empty array for empty input", () => {
    expect(buildCurvaABC([])).toEqual([])
  })

  it("single item returns percentual_acumulado 100 and categoria C", () => {
    const result = buildCurvaABC([
      { id: "1", descricao: "Item A", unidade: "m3", quantidade: 1, custoUnitario: 500 },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].percentual_acumulado).toBeCloseTo(100)
    expect(result[0].categoria).toBe("C")
  })

  it("sorts items by valorTotal descending", () => {
    const result = buildCurvaABC([
      { id: "1", descricao: "Cheap", unidade: "un", quantidade: 1, custoUnitario: 200 },
      { id: "2", descricao: "Expensive", unidade: "un", quantidade: 1, custoUnitario: 500 },
      { id: "3", descricao: "Medium", unidade: "un", quantidade: 1, custoUnitario: 300 },
    ])
    expect(result[0].valorTotal).toBe(500)
    expect(result[1].valorTotal).toBe(300)
    expect(result[2].valorTotal).toBe(200)
  })

  it("calculates percentual_acumulado correctly for three items 500/300/200", () => {
    const result = buildCurvaABC([
      { id: "1", descricao: "A", unidade: "m3", quantidade: 1, custoUnitario: 500 },
      { id: "2", descricao: "B", unidade: "m3", quantidade: 1, custoUnitario: 300 },
      { id: "3", descricao: "C", unidade: "m3", quantidade: 1, custoUnitario: 200 },
    ])
    // Total = 1000; cumulative: 500/1000=50%, 800/1000=80%, 1000/1000=100%
    expect(result[0].percentual_acumulado).toBeCloseTo(50)
    expect(result[1].percentual_acumulado).toBeCloseTo(80)
    expect(result[2].percentual_acumulado).toBeCloseTo(100)
  })

  it("classifies A for items where cumulative <= 50%", () => {
    const result = buildCurvaABC([
      { id: "1", descricao: "A", unidade: "un", quantidade: 1, custoUnitario: 500 },
      { id: "2", descricao: "B", unidade: "un", quantidade: 1, custoUnitario: 300 },
      { id: "3", descricao: "C", unidade: "un", quantidade: 1, custoUnitario: 200 },
    ])
    expect(result[0].categoria).toBe("A") // 50% <= 50
    expect(result[1].categoria).toBe("B") // 80% <= 80
    expect(result[2].categoria).toBe("C") // 100% > 80
  })

  it("calculates valorTotal as quantidade * custoUnitario", () => {
    const result = buildCurvaABC([
      { id: "1", descricao: "Concrete", unidade: "m3", quantidade: 5, custoUnitario: 200 },
    ])
    expect(result[0].valorTotal).toBe(1000)
  })

  it("handles Decimal-like string inputs", () => {
    const result = buildCurvaABC([
      { id: "1", descricao: "A", unidade: "m3", quantidade: "5.0000" as unknown as number, custoUnitario: "200.0000" as unknown as number },
    ])
    expect(result[0].valorTotal).toBe(1000)
  })
})
