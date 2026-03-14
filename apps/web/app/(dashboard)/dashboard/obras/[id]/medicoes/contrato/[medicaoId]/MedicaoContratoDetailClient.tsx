"use client"

import { useState, useTransition } from "react"
import { addContratoItem, approveMedicao, rejectMedicao, exportBoletim, getBoletimPdfUrl } from "@/lib/actions/medicoes"

interface ContratoItem {
  id: string
  descricao: string
  unidade: string
  quantidade: any
  valorUnitario: any
  acumulado: any
}

interface MedicaoContratoDetailClientProps {
  obraId: string
  medicao: {
    id: string
    periodo: string
    status: string
    empreiteiroId: string
    contrato: string | null
    aprovadoPor: string | null
    aprovadoEm: Date | null
    itens: ContratoItem[]
    totalPeriodo: number
    totalAcumuladoAnterior: number
    totalAcumulado: number
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

export function MedicaoContratoDetailClient({
  obraId,
  medicao,
  currentUserRole,
}: MedicaoContratoDetailClientProps) {
  const [showAddItem, setShowAddItem] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Add item form state
  const [descricao, setDescricao] = useState("")
  const [unidade, setUnidade] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [valorUnitario, setValorUnitario] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const statusConfig = STATUS_CONFIG[medicao.status] ?? STATUS_CONFIG.RASCUNHO
  const isAdmin = currentUserRole === "ADMIN"
  const canEdit = medicao.status === "RASCUNHO" || medicao.status === "SUBMETIDA"

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const qtd = parseFloat(quantidade)
    const val = parseFloat(valorUnitario)

    if (!descricao.trim()) { setFormError("Descricao obrigatoria"); return }
    if (!unidade.trim()) { setFormError("Unidade obrigatoria"); return }
    if (isNaN(qtd) || qtd <= 0) { setFormError("Quantidade invalida"); return }
    if (isNaN(val) || val <= 0) { setFormError("Valor unitario invalido"); return }

    startTransition(async () => {
      const result = await addContratoItem({
        medicaoId: medicao.id,
        descricao: descricao.trim(),
        unidade: unidade.trim(),
        quantidade: qtd,
        valorUnitario: val,
      })
      if ("error" in result) {
        setFormError(result.error ?? "Erro ao adicionar item")
      } else {
        setShowAddItem(false)
        setDescricao("")
        setUnidade("")
        setQuantidade("")
        setValorUnitario("")
      }
    })
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveMedicao("contrato", medicao.id)
      if ("error" in result) {
        setStatusMessage(result.error ?? "Erro ao aprovar")
      } else {
        setStatusMessage("Medicao aprovada com sucesso")
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectMedicao("contrato", medicao.id)
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
      const result = await exportBoletim("contrato", medicao.id)
      if ("status" in result && result.status === "queued") {
        setExportStatus("PDF sendo gerado. Aguarde a notificacao.")
      } else {
        setExportStatus("Erro ao gerar PDF")
      }
    })
  }

  async function handleDownloadPdf() {
    const url = await getBoletimPdfUrl(medicao.id)
    if (url) {
      window.open(url, "_blank")
    } else {
      setExportStatus("PDF ainda nao disponivel. Exporte primeiro.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Medicao Contratual — {medicao.periodo}</h1>
          <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
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
          <button
            onClick={handleDownloadPdf}
            disabled={isPending}
            className="text-sm px-3 py-1.5 rounded-md border hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            Baixar PDF
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="text-sm p-3 rounded-md bg-muted">{statusMessage}</div>
      )}
      {exportStatus && (
        <div className="text-sm p-3 rounded-md bg-blue-50 text-blue-700">{exportStatus}</div>
      )}

      {/* Empreiteiro info */}
      <div className="rounded-lg border p-4 space-y-2">
        <h3 className="font-medium text-sm">Empreiteiro</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nome: </span>
            <span>{medicao.empreiteiroId}</span>
          </div>
          {medicao.contrato && (
            <div>
              <span className="text-muted-foreground">CNPJ: </span>
              <span>{medicao.contrato}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-medium text-sm">Itens do Boletim</h3>
          {canEdit && (
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              + Adicionar Item
            </button>
          )}
        </div>

        {/* Inline add item form */}
        {showAddItem && (
          <form onSubmit={handleAddItem} className="px-4 py-3 border-b bg-muted/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Descricao *</label>
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Alvenaria de bloco ceramico"
                  className="w-full rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Unidade *</label>
                <input
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  placeholder="m2"
                  className="w-full rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Quantidade *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor Unitario (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border px-2 py-1.5 text-sm bg-background"
                />
              </div>
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Salvar Item
              </button>
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descricao</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-20">Un.</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-28">Qtd.</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Val. Unit.</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Val. Exec.</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground w-32">Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {medicao.itens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    Nenhum item adicionado. Use &quot;Adicionar Item&quot; para comecar.
                  </td>
                </tr>
              ) : (
                medicao.itens.map((item) => {
                  const qtd = parseFloat(String(item.quantidade))
                  const val = parseFloat(String(item.valorUnitario))
                  const valorExecutado = qtd * val
                  const acumulado = parseFloat(String(item.acumulado)) + valorExecutado

                  return (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">{item.descricao}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.unidade}</td>
                      <td className="px-4 py-3 text-right">
                        {qtd.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">{formatBRL(val)}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(valorExecutado)}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(acumulado)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acumulado section */}
      <div className="rounded-lg border p-4 space-y-2">
        <h3 className="font-medium text-sm mb-3">Resumo Acumulado</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Acumulado Anterior:</span>
            <span>{formatBRL(medicao.totalAcumuladoAnterior)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total deste Periodo:</span>
            <span>{formatBRL(medicao.totalPeriodo)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Acumulado Geral:</span>
            <span className="text-primary">{formatBRL(medicao.totalAcumulado)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
