"use client"

import Link from "next/link"
import { useTransition } from "react"
import { approveMedicao, rejectMedicao } from "@/lib/actions/medicoes"

interface MedicaoCardProps {
  medicao: {
    id: string
    periodo: string
    status: string
    obraId: string
    progressoGeral?: number
    totalPeriodo?: number
  }
  type: "fisica" | "contrato"
  currentUserRole: string
}

const MEDICAO_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RASCUNHO: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  SUBMETIDA: { label: "Submetida", className: "bg-blue-100 text-blue-700" },
  APROVADA: { label: "Aprovada", className: "bg-green-100 text-green-700" },
  REJEITADA: { label: "Rejeitada", className: "bg-red-100 text-red-700" },
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function MedicaoCard({ medicao, type, currentUserRole }: MedicaoCardProps) {
  const [isPending, startTransition] = useTransition()
  const statusConfig = MEDICAO_STATUS_CONFIG[medicao.status] ?? MEDICAO_STATUS_CONFIG.RASCUNHO
  const href = `/dashboard/obras/${medicao.obraId}/medicoes/${type}/${medicao.id}`
  const isAdmin = currentUserRole === "ADMIN"

  function handleApprove() {
    startTransition(async () => {
      await approveMedicao(type, medicao.id)
    })
  }

  function handleReject() {
    startTransition(async () => {
      await rejectMedicao(type, medicao.id)
    })
  }

  return (
    <div className="rounded-lg border p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <Link href={href} className="flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{medicao.periodo}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {type === "fisica" && medicao.progressoGeral !== undefined
              ? `Progresso: ${medicao.progressoGeral.toFixed(1)}%`
              : type === "contrato" && medicao.totalPeriodo !== undefined
              ? `Total: ${formatBRL(medicao.totalPeriodo)}`
              : "Ver detalhes"}
          </p>
        </Link>

        {isAdmin && medicao.status !== "APROVADA" && medicao.status !== "REJEITADA" && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Aprovar
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Rejeitar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
