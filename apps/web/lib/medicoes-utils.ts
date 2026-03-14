import Decimal from "decimal.js"

/**
 * Represents a budget item with its value and execution percentage.
 */
export interface ItemProgressoInput {
  valorTotal: number | string
  percentualExecutado: number
}

/**
 * calcularProgressoPonderado
 *
 * Computes the weighted average execution percentage across budget items.
 *
 * Formula: SUM(valorTotal * percentualExecutado / 100) / SUM(valorTotal) * 100
 *
 * Returns a number with 1 decimal place precision.
 * Returns 0 if the array is empty or if total value is zero.
 *
 * Uses Decimal.js for all arithmetic to avoid floating-point errors in financial calc.
 */
export function calcularProgressoPonderado(items: ItemProgressoInput[]): number {
  if (items.length === 0) return 0

  let sumValor = new Decimal(0)
  let sumExecutado = new Decimal(0)

  for (const item of items) {
    const val = new Decimal(String(item.valorTotal))
    const pct = new Decimal(item.percentualExecutado)
    sumValor = sumValor.plus(val)
    sumExecutado = sumExecutado.plus(val.times(pct).dividedBy(100))
  }

  if (sumValor.isZero()) return 0

  const progresso = sumExecutado.dividedBy(sumValor).times(100)
  return parseFloat(progresso.toFixed(1))
}
