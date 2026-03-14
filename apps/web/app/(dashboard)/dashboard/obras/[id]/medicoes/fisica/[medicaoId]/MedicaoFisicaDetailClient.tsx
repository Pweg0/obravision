"use client"

import { useState, useTransition } from "react"
import { updateMedicaoFisicaItem, approveMedicao, rejectMedicao, exportBoletim } from "@/lib/actions/medicoes"
import { ProgressoGeral } from "@/components/medicoes/ProgressoGeral"

interface MedicaoFisicaItem {
  id: string
  orcamentoItemId: string
  percentualMedido: any
  acumulado: any
  orcamentoItem: {
    id: string
    descricao: string
    quantidade: any
    custoUnitario: any
    unidade: string
  }
}

interface MedicaoFisicaDetailClientProps {
  obraId: string
  medicao: {
    id: string
    periodo: string
    status: string
    aprovadoPor: string | null
    aprovadoEm: Date | null
    progressoGeral: number
    itens: MedicaoFisicaItem[]
  }
  currentUserRole: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RASCUNHO: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  SUBMETIDA: { label: "Submetida", className: "bg-blue-100 text-blue-700" },
  APROVADA: { label: "Aprovada", className: "bg-green-100 text-green-700" },
  REJEITADA: { label: "Rejeitada", className: "bg-red-100 text-red-700" },
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function MedicaoFisicaDetailClient({
  obraId,
  medicao,
  currentUserRole,
}: MedicaoFisicaDetailClientProps) {
  const [progresso, setProgresso] = useState(medicao.progressoGeral)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  const statusConfig = STATUS_CONFIG[medicao.status] ?? STATUS_CONFIG.RASCUNHO
  const isAdmin = currentUserRole === "ADMIN"
  const canEdit = medicao.status === "RASCUNHO" || medicao.status === "SUBMETIDA"

  function handlePercentualChange(itemId: string, value: number) {
    startTransition(async () => {
      const result = await updateMedicaoFisicaItem({
        medicaoFisicaItemId: itemId,
        percentualExecutado: value,
      })
      if ("progressoGeral" in result && result.progressoGeral !== undefined) {
        setProgresso(result.progressoGeral)
      }
    })
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveMedicao("fisica", medicao.id)
      if ("error" in result) {
        setStatusMessage(result.error ?? "Erro ao aprovar")
      } else {
        setStatusMessage("Medicao aprovada com sucesso")
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectMedicao("fisica", medicao.id)
      if ("error" in result) {
        setStatusMessage(result.error ?? "Erro ao rejeitar")
      } else {
        setStatusMessage("Medicao rejeitada")
      }
    })
  }

  function handleExport() {
    startTransition(async () => {
      setExportStatus("Gerando PDF...")
      const result = await exportBoletim("fisica", medicao.id)
      if ("status" in result && result.status === "queued") {
        setExportStatus("PDF sendo gerado. Aguarde a notificacao.")
      } else {
        setExportStatus("Erro ao gerar PDF")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Medicao Fisica — {medicao.periodo}</h1>
          <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAdmin && canEdit && (
            <>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="text-sm px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Aprovar
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="text-sm px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Rejeitar
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            disabled={isPending}
            className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Exportar Boletim
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="text-sm p-3 rounded-md bg-muted">{statusMessage}</div>
      )}
      {exportStatus && (
        <div className="text-sm p-3 rounded-md bg-blue-50 text-blue-700">{exportStatus}</div>
      )}

      {/* Progress indicator */}
      <ProgressoGeral progresso={progresso} />

      {/* Items table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="font-medium text-sm">Itens do Orcamento</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descricao</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-20">Un.</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-28">Qtd. Orc.</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Custo Total</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-40">% Executado</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Valor Exec.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {medicao.itens.map((item) => {
                const qtd = parseFloat(String(item.orcamentoItem.quantidade))
                const custo = parseFloat(String(item.orcamentoItem.custoUnitario))
                const custoTotal = qtd * custo
                const pct = parseFloat(String(item.percentualMedido))
                const valorExecutado = custoTotal * (pct / 100)

                return (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">{item.orcamentoItem.descricao}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.orcamentoItem.unidade}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {qtd.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right">{formatBRL(custoTotal)}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            defaultValue={pct}
                            onMouseUp={(e) =>
                              handlePercentualChange(item.id, Number((e.target as HTMLInputElement).value))
                            }
                            onTouchEnd={(e) =>
                              handlePercentualChange(item.id, Number((e.target as HTMLInputElement).value))
                            }
                            className="flex-1 cursor-pointer h-2 rounded-full accent-primary"
                            disabled={isPending}
                          />
                          <span className="text-right w-12 text-muted-foreground text-xs">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-right block">{pct.toFixed(1)}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{formatBRL(valorExecutado)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
