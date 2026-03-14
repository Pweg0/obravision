/**
 * Utility functions for orcamento analysis.
 * No DB calls — safe to import in both server and client contexts.
 */

export interface CurvaABCInput {
  id: string
  descricao: string
  unidade: string
  quantidade: number | string
  custoUnitario: number | string
  sinapiCodigo?: string | null
  etapaNome?: string
}

export interface CurvaABCItem extends CurvaABCInput {
  valorTotal: number
  percentual: number
  percentual_acumulado: number
  categoria: "A" | "B" | "C"
  rank: number
}

/**
 * Builds an ABC curve analysis from a flat list of orcamento items.
 *
 * Classification:
 *   - A: items that cumulatively represent up to 50% of total cost (vital few)
 *   - B: items from 50% up to 80% (important)
 *   - C: items above 80% (trivial many)
 *
 * Items are sorted by valorTotal descending (most expensive first).
 */
export function buildCurvaABC(items: CurvaABCInput[]): CurvaABCItem[] {
  if (items.length === 0) return []

  // Calculate totalValue for each item
  const withTotals = items.map((item) => ({
    ...item,
    valorTotal: Number(item.quantidade) * Number(item.custoUnitario),
  }))

  // Sort by valorTotal descending
  withTotals.sort((a, b) => b.valorTotal - a.valorTotal)

  // Grand total
  const grandTotal = withTotals.reduce((sum, item) => sum + item.valorTotal, 0)

  if (grandTotal === 0) {
    return withTotals.map((item, i) => ({
      ...item,
      percentual: 0,
      percentual_acumulado: 0,
      categoria: "C" as const,
      rank: i + 1,
    }))
  }

  let cumulative = 0

  return withTotals.map((item, i) => {
    const percentual = (item.valorTotal / grandTotal) * 100
    cumulative += percentual
    const percentual_acumulado = cumulative

    const categoria: "A" | "B" | "C" =
      percentual_acumulado <= 50 ? "A" : percentual_acumulado <= 80 ? "B" : "C"

    return {
      ...item,
      percentual: Math.round(percentual * 100) / 100,
      percentual_acumulado: Math.round(percentual_acumulado * 100) / 100,
      categoria,
      rank: i + 1,
    }
  })
}
