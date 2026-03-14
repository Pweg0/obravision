/**
 * Pure calculation helpers for orcamento (budget) operations.
 * No DB calls — safe to import in both server and client contexts.
 */

/**
 * Calculates Preco de Venda from custo and BDI percentage.
 * Formula: custo * (1 + bdi / 100)
 * Do NOT store precoVenda in DB — derive at render time.
 */
export function calcularPrecoVenda(custo: number, bdi: number): number {
  return custo * (1 + bdi / 100)
}
