"use client"

import { useState, useTransition } from "react"
import { getPedidoPdfUrl } from "@/lib/actions/compras"
import { Button } from "@/components/ui/button"

const PEDIDO_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  RASCUNHO:          { label: "Rascunho",          color: "#6b7280", bgColor: "#f3f4f6" },
  ENVIADO:           { label: "Enviado",            color: "#2563eb", bgColor: "#eff6ff" },
  CONFIRMADO:        { label: "Confirmado",         color: "#059669", bgColor: "#d1fae5" },
  ENTREGUE_PARCIAL:  { label: "Entregue Parcial",   color: "#d97706", bgColor: "#fef3c7" },
  ENTREGUE:          { label: "Entregue",           color: "#059669", bgColor: "#d1fae5" },
  CANCELADO:         { label: "Cancelado",          color: "#dc2626", bgColor: "#fee2e2" },
}

interface PedidoCardProps {
  pedido: {
    id: string
    status: string
    totalEstimado: string | number
    pdfR2Key?: string | null
    createdAt: Date | string
    fornecedor: {
      id: string
      nome: string
      cnpj?: string | null
    }
    itens: Array<{
      id: string
      descricao: string
      quantidade: string | number
      unidade: string
      precoUnitario: string | number
    }>
  }
}

export function PedidoCard({ pedido }: PedidoCardProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loadingPdf, startPdfTransition] = useTransition()

  const statusConfig = PEDIDO_STATUS_CONFIG[pedido.status] ?? PEDIDO_STATUS_CONFIG.RASCUNHO
  const total = parseFloat(String(pedido.totalEstimado))
  const createdAt = new Date(pedido.createdAt)
  const dateStr = createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

  function handleDownloadPdf() {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
      return
    }
    startPdfTransition(async () => {
      const url = await getPedidoPdfUrl(pedido.id)
      if (url) {
        setPdfUrl(url)
        window.open(url, "_blank")
      }
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.color}40`,
              }}
            >
              {statusConfig.label}
            </span>
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
          <p className="font-medium">Pedido #{pedido.id.slice(-8).toUpperCase()}</p>
          <p className="text-sm text-muted-foreground">{pedido.fornecedor.nome}</p>
          {pedido.fornecedor.cnpj && (
            <p className="text-xs text-muted-foreground">CNPJ: {pedido.fornecedor.cnpj}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold">
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>

      {/* Items list */}
      {pedido.itens.length > 0 && (
        <div className="rounded border overflow-hidden">
          <div className="bg-muted/30 px-3 py-1.5 border-b">
            <p className="text-xs font-medium text-muted-foreground">
              Itens ({pedido.itens.length})
            </p>
          </div>
          <ul className="divide-y">
            {pedido.itens.map((item) => {
              const qty = parseFloat(String(item.quantidade))
              const preco = parseFloat(String(item.precoUnitario))
              const subtotal = qty * preco
              return (
                <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{item.descricao}</span>
                  <span className="text-muted-foreground mx-3 text-xs">
                    {qty.toLocaleString("pt-BR")} {item.unidade}
                  </span>
                  <span className="font-medium">
                    {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* PDF download */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={loadingPdf}
          className="cursor-pointer"
        >
          {loadingPdf ? "Gerando PDF..." : "Baixar PDF"}
        </Button>
        {pedido.pdfR2Key && (
          <span className="text-xs text-green-600">PDF disponivel</span>
        )}
        {!pedido.pdfR2Key && (
          <span className="text-xs text-muted-foreground">PDF em geracao...</span>
        )}
      </div>
    </div>
  )
}
