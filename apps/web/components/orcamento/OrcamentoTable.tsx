"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EtapaForm } from "./EtapaForm"
import { ItemForm } from "./ItemForm"
import { ImportModal } from "./ImportModal"
import { deleteItem, deleteEtapa } from "@/lib/actions/orcamento"
import { calcularPrecoVenda } from "@/lib/orcamento"

interface OrcamentoItem {
  id: string
  descricao: string
  unidade: string
  quantidade: string | number
  custoUnitario: string | number
  sinapiCodigo: string | null
}

interface OrcamentoEtapa {
  id: string
  nome: string
  ordem: number
  itens: OrcamentoItem[]
}

interface OrcamentoTableProps {
  orcamentoId: string
  etapas: OrcamentoEtapa[]
  bdi: number
  obraId: string
  obraEstado?: string
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parseDecimal(v: string | number): number {
  if (typeof v === "number") return v
  return parseFloat(v)
}

export function OrcamentoTable({ orcamentoId, etapas, bdi, obraId, obraEstado }: OrcamentoTableProps) {
  const [view, setView] = useState<"custo" | "venda">("custo")
  const [collapsedEtapas, setCollapsedEtapas] = useState<Set<string>>(new Set())
  const [showEtapaForm, setShowEtapaForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState<string | null>(null) // etapaId
  const [showImport, setShowImport] = useState<{ etapaId: string; etapaNome: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleCollapse(etapaId: string) {
    setCollapsedEtapas((prev) => {
      const next = new Set(prev)
      if (next.has(etapaId)) next.delete(etapaId)
      else next.add(etapaId)
      return next
    })
  }

  function handleDeleteItem(itemId: string) {
    if (!confirm("Excluir este item?")) return
    startTransition(async () => {
      await deleteItem(itemId)
    })
  }

  function handleDeleteEtapa(etapaId: string, etapaNome: string) {
    if (!confirm(`Excluir a etapa "${etapaNome}"? Ela nao pode ter itens.`)) return
    startTransition(async () => {
      await deleteEtapa(etapaId)
    })
  }

  const grandTotalCusto = etapas.reduce((sum, etapa) => {
    return sum + etapa.itens.reduce((s, item) => {
      return s + parseDecimal(item.quantidade) * parseDecimal(item.custoUnitario)
    }, 0)
  }, 0)

  const grandTotalVenda = calcularPrecoVenda(grandTotalCusto, bdi)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-md border p-1">
          <button
            onClick={() => setView("custo")}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              view === "custo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Custo
          </button>
          <button
            onClick={() => setView("venda")}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              view === "venda"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Venda (BDI {bdi}%)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/obras/${obraId}/orcamento/curva-abc`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Ver Curva ABC
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowEtapaForm(true)}>
            + Adicionar Etapa
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2 font-medium">Descricao</th>
              <th className="text-left px-4 py-2 font-medium w-16">Un.</th>
              <th className="text-right px-4 py-2 font-medium w-24">Qtd.</th>
              <th className="text-right px-4 py-2 font-medium w-32">
                {view === "custo" ? "Custo Unit." : "Preco Unit."}
              </th>
              <th className="text-right px-4 py-2 font-medium w-32">
                {view === "custo" ? "Custo Total" : "Preco Total"}
              </th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {etapas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma etapa cadastrada. Clique em &ldquo;Adicionar Etapa&rdquo; para comecar.
                </td>
              </tr>
            )}
            {etapas.map((etapa) => {
              const etapaCusto = etapa.itens.reduce(
                (s, item) => s + parseDecimal(item.quantidade) * parseDecimal(item.custoUnitario),
                0
              )
              const etapaTotal = view === "custo" ? etapaCusto : calcularPrecoVenda(etapaCusto, bdi)
              const isCollapsed = collapsedEtapas.has(etapa.id)

              return (
                <>
                  {/* Etapa row */}
                  <tr
                    key={`etapa-${etapa.id}`}
                    className="border-b bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => toggleCollapse(etapa.id)}
                  >
                    <td className="px-4 py-2 font-semibold" colSpan={4}>
                      <span className="mr-2 text-muted-foreground">{isCollapsed ? "▶" : "▼"}</span>
                      {etapa.nome}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({etapa.itens.length} {etapa.itens.length === 1 ? "item" : "itens"})
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{formatBRL(etapaTotal)}</td>
                    <td
                      className="px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowItemForm(etapa.id)}
                        >
                          + Item
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowImport({ etapaId: etapa.id, etapaNome: etapa.nome })}
                        >
                          Importar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEtapa(etapa.id, etapa.nome)}
                          disabled={isPending}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Item rows */}
                  {!isCollapsed &&
                    etapa.itens.map((item) => {
                      const qtd = parseDecimal(item.quantidade)
                      const custo = parseDecimal(item.custoUnitario)
                      const totalCusto = qtd * custo
                      const unitDisplay = view === "custo" ? custo : calcularPrecoVenda(custo, bdi)
                      const totalDisplay = view === "custo" ? totalCusto : calcularPrecoVenda(totalCusto, bdi)

                      return (
                        <tr
                          key={`item-${item.id}`}
                          className="border-b last:border-b-0 hover:bg-muted/5 transition-colors"
                        >
                          <td className="px-4 py-2 pl-8">
                            <span>{item.descricao}</span>
                            {item.sinapiCodigo && (
                              <span className="ml-2 text-xs text-muted-foreground font-mono">
                                [{item.sinapiCodigo}]
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{item.unidade}</td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {qtd.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {formatBRL(unitDisplay)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums font-medium">
                            {formatBRL(totalDisplay)}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={isPending}
                            >
                              Excluir
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                </>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td className="px-4 py-2 font-bold" colSpan={4}>
                Total Geral
              </td>
              <td className="px-4 py-2 text-right font-bold tabular-nums text-primary">
                {formatBRL(view === "custo" ? grandTotalCusto : grandTotalVenda)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Etapa form modal */}
      {showEtapaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Nova Etapa</h3>
            <EtapaForm
              orcamentoId={orcamentoId}
              nextOrdem={etapas.length + 1}
              onSuccess={() => setShowEtapaForm(false)}
              onCancel={() => setShowEtapaForm(false)}
            />
          </div>
        </div>
      )}

      {/* Item form modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Novo Item</h3>
            <ItemForm
              etapaId={showItemForm}
              obraEstado={obraEstado}
              onSuccess={() => setShowItemForm(null)}
              onCancel={() => setShowItemForm(null)}
            />
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Importar Planilha</h3>
            <ImportModal
              etapaId={showImport.etapaId}
              etapaNome={showImport.etapaNome}
              onSuccess={(count) => {
                setShowImport(null)
                alert(`${count} itens importados com sucesso.`)
              }}
              onCancel={() => setShowImport(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
