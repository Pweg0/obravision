import { describe, it, expect } from "vitest"
import { calcularPrecoVenda } from "@/lib/orcamento"

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
