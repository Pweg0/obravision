"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { approveRequisicao, rejectRequisicao } from "@/lib/actions/compras"

// ---- Status configuration ----

export const REQUISICAO_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  RASCUNHO:       { label: "Rascunho",       color: "#6b7280", bgColor: "#f3f4f6" },
  PENDENTE:       { label: "Pendente",        color: "#d97706", bgColor: "#fef3c7" },
  APROVADA:       { label: "Aprovada",        color: "#059669", bgColor: "#d1fae5" },
  REJEITADA:      { label: "Rejeitada",       color: "#dc2626", bgColor: "#fee2e2" },
  CANCELADA:      { label: "Cancelada",       color: "#6b7280", bgColor: "#f3f4f6" },
}

interface RequisicaoCardProps {
  requisicao: {
    id: string
    obraId: string
    descricao: string
    // Prisma Decimal | string | number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quantidade: any
    unidade: string
    status: string
    urgente?: boolean
    solicitanteId: string
    createdAt: Date | string
    orcamentoItem?: {
      id: string
      descricao: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      quantidade: any
      unidade: string
    } | null
    cotacoes?: Array<{ id: string }>
  }
  currentUserRole: string
  currentUserId: string
}

export function RequisicaoCard({ requisicao, currentUserRole, currentUserId }: RequisicaoCardProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPendingApprove, startApproveTransition] = useTransition()
  const [isPendingReject, startRejectTransition] = useTransition()

  const statusConfig = REQUISICAO_STATUS_CONFIG[requisicao.status] ?? REQUISICAO_STATUS_CONFIG.RASCUNHO
  const canManage = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"
  const canApprove = canManage && requisicao.status === "PENDENTE"
  const qtd = parseFloat(String(requisicao.quantidade))
  const cotacaoCount = requisicao.cotacoes?.length ?? 0

  const createdAt = new Date(requisicao.createdAt)
  const dateStr = createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })

  function handleApprove() {
    setError(null)
    startApproveTransition(async () => {
      const result = await approveRequisicao(requisicao.id)
      if ("error" in result) setError(result.error)
    })
  }

  function handleReject() {
    setError(null)
    startRejectTransition(async () => {
      const result = await rejectRequisicao(requisicao.id)
      if ("error" in result) setError(result.error)
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
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
            {requisicao.urgente && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                Urgente
              </span>
            )}
            {cotacaoCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {cotacaoCount} cotacao{cotacaoCount !== 1 ? "es" : ""}
              </span>
            )}
          </div>
          <p className="font-medium mt-1 truncate">{requisicao.descricao}</p>
          <p className="text-sm text-muted-foreground">
            {qtd.toLocaleString("pt-BR")} {requisicao.unidade}
          </p>
          {requisicao.orcamentoItem && (
            <p className="text-xs text-muted-foreground mt-1">
              Orcamento: {requisicao.orcamentoItem.descricao}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{dateStr}</span>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={`/dashboard/obras/${requisicao.obraId}/compras/${requisicao.id}`}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Ver detalhes
        </Link>

        {canApprove && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50 cursor-pointer"
              onClick={handleApprove}
              disabled={isPendingApprove || isPendingReject}
            >
              {isPendingApprove ? "Aprovando..." : "Aprovar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
              onClick={handleReject}
              disabled={isPendingApprove || isPendingReject}
            >
              {isPendingReject ? "Rejeitando..." : "Rejeitar"}
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
