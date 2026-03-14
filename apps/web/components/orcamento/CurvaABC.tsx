"use client"

import { useMemo } from "react"
import { buildCurvaABC } from "@/lib/orcamento-utils"
import type { CurvaABCInput } from "@/lib/orcamento-utils"

interface CurvaABCProps {
  items: CurvaABCInput[]
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const CATEGORIA_STYLES: Record<"A" | "B" | "C", string> = {
  A: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  B: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  C: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

const CATEGORIA_LABELS: Record<"A" | "B" | "C", string> = {
  A: "A — Vital",
  B: "B — Importante",
  C: "C — Trivial",
}

export function CurvaABC({ items }: CurvaABCProps) {
  const curva = useMemo(() => buildCurvaABC(items), [items])

  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Nenhum item no orcamento. Adicione itens para ver a Curva ABC.
      </div>
    )
  }

  // Count by category
  const counts = curva.reduce(
    (acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const grandTotal = curva.reduce((sum, item) => sum + item.valorTotal, 0)

  return (
    <div className="space-y-4">
      {/* Category summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {(["A", "B", "C"] as const).map((cat) => (
          <div key={cat} className="rounded-lg border p-3 space-y-1">
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${CATEGORIA_STYLES[cat]}`}>
              {cat}
            </div>
            <p className="text-2xl font-bold">{counts[cat] ?? 0}</p>
            <p className="text-xs text-muted-foreground">{CATEGORIA_LABELS[cat]}</p>
          </div>
        ))}
      </div>

      {/* ABC table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b">
              <th className="text-left px-4 py-2 font-medium w-8">#</th>
              <th className="text-left px-4 py-2 font-medium">Descricao</th>
              <th className="text-left px-4 py-2 font-medium w-16">Un.</th>
              <th className="text-right px-4 py-2 font-medium w-24">Qtd.</th>
              <th className="text-right px-4 py-2 font-medium w-32">Valor Total</th>
              <th className="text-right px-4 py-2 font-medium w-28">% Acumulado</th>
              <th className="text-center px-4 py-2 font-medium w-24">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {curva.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b last:border-b-0 hover:bg-muted/5 transition-colors"
              >
                <td className="px-4 py-2 text-muted-foreground tabular-nums">{idx + 1}</td>
                <td className="px-4 py-2">
                  <span className="font-medium">{item.descricao}</span>
                  {item.sinapiCodigo && (
                    <span className="ml-2 text-xs text-muted-foreground font-mono">
                      [{item.sinapiCodigo}]
                    </span>
                  )}
                  {item.etapaNome && (
                    <span className="ml-2 text-xs text-muted-foreground">— {item.etapaNome}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{item.unidade}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {Number(item.quantidade).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  {formatBRL(item.valorTotal)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="h-1.5 rounded-full bg-primary/20 overflow-hidden"
                      style={{ width: "60px" }}
                    >
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(item.percentual_acumulado, 100)}%` }}
                      />
                    </div>
                    <span>{item.percentual_acumulado.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${CATEGORIA_STYLES[item.categoria]}`}
                  >
                    {item.categoria}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td className="px-4 py-2 font-bold" colSpan={4}>
                Total Geral
              </td>
              <td className="px-4 py-2 text-right font-bold tabular-nums text-primary">
                {formatBRL(grandTotal)}
              </td>
              <td className="px-4 py-2 text-right font-medium text-muted-foreground">100%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="rounded-lg border p-4 bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground mb-2">Classificacao Curva ABC</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            <span className={`inline-flex px-1.5 py-0.5 rounded font-semibold mr-1 ${CATEGORIA_STYLES.A}`}>A</span>
            Itens ate 50% do custo total (os mais impactantes)
          </span>
          <span>
            <span className={`inline-flex px-1.5 py-0.5 rounded font-semibold mr-1 ${CATEGORIA_STYLES.B}`}>B</span>
            Itens entre 50% e 80%
          </span>
          <span>
            <span className={`inline-flex px-1.5 py-0.5 rounded font-semibold mr-1 ${CATEGORIA_STYLES.C}`}>C</span>
            Itens acima de 80%
          </span>
        </div>
      </div>
    </div>
  )
}
