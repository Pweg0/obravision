"use client"

import { useState, useTransition } from "react"
import { buildMapa } from "@/lib/compras-utils"
import { Button } from "@/components/ui/button"
import { createPedido } from "@/lib/actions/compras"
import { useRouter } from "next/navigation"

interface Cotacao {
  id: string
  requisicaoId: string
  fornecedorId: string
  precoUnitario: string | number
  prazoEntrega?: number | null
  fornecedor: {
    id: string
    nome: string
  }
}

interface RequisicaoItem {
  id: string
  descricao: string
  quantidade: string | number
  unidade: string
}

interface MapaComparativoProps {
  obraId: string
  items: RequisicaoItem[]
  cotacoes: Cotacao[]
}

export function MapaComparativo({ obraId, items, cotacoes }: MapaComparativoProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Derive unique fornecedores from cotacoes
  const fornecedoresMap = new Map<string, { id: string; nome: string }>()
  for (const cotacao of cotacoes) {
    if (!fornecedoresMap.has(cotacao.fornecedorId)) {
      fornecedoresMap.set(cotacao.fornecedorId, {
        id: cotacao.fornecedor.id,
        nome: cotacao.fornecedor.nome,
      })
    }
  }
  const fornecedores = Array.from(fornecedoresMap.values())

  // Build mapa rows
  const mapaRows = buildMapa(items, cotacoes)

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    })
  }

  // Calculate totals per fornecedor
  const totaisPorFornecedor = fornecedores.map((f) => {
    const total = mapaRows.reduce((sum, row) => {
      const preco = row.precos[f.id]
      if (preco === undefined) return sum
      return sum + preco * row.quantidade
    }, 0)
    return { fornecedorId: f.id, total }
  })

  const melhorFornecedorTotal = totaisPorFornecedor.reduce<{
    fornecedorId: string | null
    total: number
  }>(
    (best, curr) => {
      if (curr.total === 0) return best
      if (!best.fornecedorId || curr.total < best.total) {
        return { fornecedorId: curr.fornecedorId, total: curr.total }
      }
      return best
    },
    { fornecedorId: null, total: Infinity }
  )

  function handleSelectFornecedor(fornecedorId: string) {
    setError(null)
    startTransition(async () => {
      // Build pedido items from all rows where this fornecedor has a quote
      const pedidoItens = mapaRows
        .filter((row) => row.precos[fornecedorId] !== undefined)
        .map((row) => ({
          requisicaoId: row.requisicaoId,
          descricao: row.descricao,
          unidade: row.unidade,
          quantidade: row.quantidade,
          precoUnitario: row.precos[fornecedorId]!,
        }))

      if (pedidoItens.length === 0) {
        setError("Fornecedor nao tem cotacoes suficientes para criar pedido")
        return
      }

      const result = await createPedido({
        obraId,
        fornecedorId,
        itens: pedidoItens,
      })

      if ("error" in result) {
        setError(result.error)
      } else if ("pedido" in result) {
        router.push(`/dashboard/obras/${obraId}/compras`)
      }
    })
  }

  if (cotacoes.length < 2 || fornecedores.length < 2) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Adicione cotacoes de pelo menos 2 fornecedores para ver o mapa comparativo.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Mapa Comparativo de Cotacoes</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[200px]">
                Item
              </th>
              <th className="text-right px-2 py-2 font-medium text-muted-foreground w-16">Qtd</th>
              <th className="text-right px-2 py-2 font-medium text-muted-foreground w-12">Un</th>
              {fornecedores.map((f) => (
                <th
                  key={f.id}
                  className="text-right px-3 py-2 font-medium min-w-[120px]"
                >
                  {f.nome}
                  {melhorFornecedorTotal.fornecedorId === f.id && (
                    <span className="ml-1 text-xs text-green-600">(melhor total)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mapaRows.map((row) => (
              <tr key={row.requisicaoId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2">
                  <p className="font-medium">{row.descricao}</p>
                </td>
                <td className="text-right px-2 py-2 text-muted-foreground">
                  {row.quantidade.toLocaleString("pt-BR")}
                </td>
                <td className="text-right px-2 py-2 text-muted-foreground text-xs">
                  {row.unidade}
                </td>
                {fornecedores.map((f) => {
                  const preco = row.precos[f.id]
                  const isMelhor = row.melhorFornecedorId === f.id
                  return (
                    <td
                      key={f.id}
                      className={`text-right px-3 py-2 transition-colors ${
                        isMelhor
                          ? "bg-green-50 text-green-700 font-medium dark:bg-green-950/30 dark:text-green-400"
                          : "text-foreground"
                      }`}
                    >
                      {preco !== undefined ? (
                        <>
                          {formatBRL(preco)}
                          {isMelhor && (
                            <span className="ml-1 text-xs">*</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="border-t bg-muted/30">
              <td colSpan={3} className="px-3 py-2 font-medium text-sm">
                Total
              </td>
              {totaisPorFornecedor.map(({ fornecedorId, total }) => {
                const isMelhorTotal = melhorFornecedorTotal.fornecedorId === fornecedorId
                return (
                  <td
                    key={fornecedorId}
                    className={`text-right px-3 py-2 font-medium ${
                      isMelhorTotal
                        ? "text-green-700 dark:text-green-400"
                        : "text-foreground"
                    }`}
                  >
                    {total > 0 ? formatBRL(total) : "—"}
                  </td>
                )
              })}
            </tr>
            {/* Select buttons row */}
            <tr>
              <td colSpan={3} />
              {fornecedores.map((f) => (
                <td key={f.id} className="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant={melhorFornecedorTotal.fornecedorId === f.id ? "default" : "outline"}
                    onClick={() => handleSelectFornecedor(f.id)}
                    disabled={isPending}
                    className="text-xs h-7 cursor-pointer"
                  >
                    {isPending ? "Criando..." : "Selecionar"}
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        * Menor preco por item destacado em verde. Ao selecionar um fornecedor, um pedido de compra sera criado automaticamente.
      </p>
    </div>
  )
}
