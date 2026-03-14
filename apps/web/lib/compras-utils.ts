/**
 * compras-utils.ts
 * Pure utility functions for the procurement module.
 */

// ---- Types ----

export interface MapaRequisicaoItem {
  id: string
  descricao: string
  quantidade: number | string
  unidade: string
}

export interface MapaCotacao {
  id: string
  requisicaoId: string
  fornecedorId: string
  precoUnitario: number | string
  prazoEntrega?: number | null
}

export interface MapaRow {
  /** The requisicao item ID (used as row key) */
  requisicaoId: string
  descricao: string
  quantidade: number
  unidade: string
  /** precos[fornecedorId] = precoUnitario (number), undefined if no quote from that supplier */
  precos: Record<string, number>
  /** The lowest price among all supplier quotes for this item, null if no quotes */
  menorPreco: number | null
  /** The fornecedorId that has the lowest price, null if no quotes */
  melhorFornecedorId: string | null
}

// ---- buildMapa ----

/**
 * Build the mapa comparativo (side-by-side comparison table) from requisicao items and cotacoes.
 *
 * - Items become rows (one row per requisicao item).
 * - Fornecedores become columns (derived from unique fornecedorIds in cotacoes).
 * - Each cell is the precoUnitario for that (item, fornecedor) pair.
 * - menorPreco and melhorFornecedorId indicate which supplier has the best price per row.
 *
 * @param items   - Array of requisicao items (id, descricao, quantidade, unidade)
 * @param cotacoes - Array of cotacoes (each links requisicaoId -> fornecedorId + precoUnitario)
 */
export function buildMapa(items: MapaRequisicaoItem[], cotacoes: MapaCotacao[]): MapaRow[] {
  return items.map((item) => {
    // Find all cotacoes for this item
    const itemCotacoes = cotacoes.filter((c) => c.requisicaoId === item.id)

    // Build precos record: { [fornecedorId]: precoUnitario }
    const precos: Record<string, number> = {}
    for (const cotacao of itemCotacoes) {
      precos[cotacao.fornecedorId] = parseFloat(String(cotacao.precoUnitario))
    }

    // Find the best price
    const entries = Object.entries(precos)
    let menorPreco: number | null = null
    let melhorFornecedorId: string | null = null

    if (entries.length > 0) {
      for (const [fornecedorId, preco] of entries) {
        if (menorPreco === null || preco < menorPreco) {
          menorPreco = preco
          melhorFornecedorId = fornecedorId
        }
      }
    }

    return {
      requisicaoId: item.id,
      descricao: item.descricao,
      quantidade: parseFloat(String(item.quantidade)),
      unidade: item.unidade,
      precos,
      menorPreco,
      melhorFornecedorId,
    }
  })
}
