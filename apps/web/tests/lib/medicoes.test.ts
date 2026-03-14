import { describe, it, expect } from "vitest"
import { calcularProgressoPonderado } from "@/lib/medicoes-utils"

describe("calcularProgressoPonderado (MED-01)", () => {
  it("returns 0 for empty array", () => {
    const result = calcularProgressoPonderado([])
    expect(result).toBe(0)
  })

  it("returns 0 when all items have 0% executed", () => {
    const result = calcularProgressoPonderado([
      { valorTotal: "1000.0000", percentualExecutado: 0 },
      { valorTotal: "500.0000", percentualExecutado: 0 },
    ])
    expect(result).toBe(0)
  })

  it("returns 100 when all items have 100% executed", () => {
    const result = calcularProgressoPonderado([
      { valorTotal: "1000.0000", percentualExecutado: 100 },
      { valorTotal: "500.0000", percentualExecutado: 100 },
    ])
    expect(result).toBe(100)
  })

  it("returns weighted average (66.7 for given example from MED-01)", () => {
    // SUM(1000*50/100 + 500*100/100) / SUM(1000+500) = (500 + 500) / 1500 = 66.666...
    const result = calcularProgressoPonderado([
      { valorTotal: "1000.0000", percentualExecutado: 50 },
      { valorTotal: "500.0000", percentualExecutado: 100 },
    ])
    expect(result).toBe(66.7)
  })

  it("weights by valorTotal correctly — higher value items have more influence", () => {
    // item1: 1000 * 80/100 = 800; item2: 100 * 0/100 = 0; total: 800 / 1100 = 72.7%
    const result = calcularProgressoPonderado([
      { valorTotal: "1000.0000", percentualExecutado: 80 },
      { valorTotal: "100.0000", percentualExecutado: 0 },
    ])
    expect(result).toBe(72.7)
  })

  it("handles single item", () => {
    const result = calcularProgressoPonderado([
      { valorTotal: "5000.0000", percentualExecutado: 75 },
    ])
    expect(result).toBe(75)
  })

  it("handles zero valorTotal gracefully (returns 0)", () => {
    const result = calcularProgressoPonderado([
      { valorTotal: "0.0000", percentualExecutado: 50 },
    ])
    expect(result).toBe(0)
  })

  it("accepts numeric valorTotal strings from Prisma Decimal", () => {
    const result = calcularProgressoPonderado([
      { valorTotal: "2000.0000", percentualExecutado: 25 },
      { valorTotal: "2000.0000", percentualExecutado: 75 },
    ])
    // 2000*25/100 + 2000*75/100 = 500 + 1500 = 2000 / 4000 = 50%
    expect(result).toBe(50)
  })
})
