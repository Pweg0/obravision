"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { RequisicaoCard } from "@/components/compras/RequisicaoCard"
import { RequisicaoForm } from "@/components/compras/RequisicaoForm"
import { listRequisicoes } from "@/lib/actions/compras"

// ---- Status filter tabs ----

const STATUS_TABS = [
  { key: "todas",      label: "Todas",         filter: (s: string) => true },
  { key: "pendentes",  label: "Pendentes",     filter: (s: string) => s === "PENDENTE" },
  { key: "aprovadas",  label: "Aprovadas",     filter: (s: string) => s === "APROVADA" },
  { key: "canceladas", label: "Canceladas",    filter: (s: string) => ["CANCELADA", "REJEITADA"].includes(s) },
] as const

type Requisicao = Awaited<ReturnType<typeof listRequisicoes>>[number]

interface ComprasClientProps {
  obraId: string
  initialRequisicoes: Requisicao[]
  currentUserRole: string
  currentUserId: string
}

export function ComprasClient({
  obraId,
  initialRequisicoes,
  currentUserRole,
  currentUserId,
}: ComprasClientProps) {
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>(initialRequisicoes)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("todas")
  const [isRefreshing, startRefreshTransition] = useTransition()

  function refreshData() {
    startRefreshTransition(async () => {
      const data = await listRequisicoes(obraId)
      setRequisicoes(data)
    })
  }

  function handleFormSuccess() {
    setShowForm(false)
    refreshData()
  }

  // Filter requisicoes by active tab
  const tabConfig = STATUS_TABS.find((t) => t.key === activeTab) ?? STATUS_TABS[0]
  const filteredRequisicoes = requisicoes.filter((r) => tabConfig.filter(r.status))

  // Counts for badges
  const countByStatus = {
    pendentes:  requisicoes.filter((r) => r.status === "PENDENTE").length,
    aprovadas:  requisicoes.filter((r) => r.status === "APROVADA").length,
    canceladas: requisicoes.filter((r) => ["CANCELADA", "REJEITADA"].includes(r.status)).length,
  }

  const badgeCount: Record<string, number | null> = {
    todas: null,
    pendentes: countByStatus.pendentes,
    aprovadas: countByStatus.aprovadas,
    canceladas: countByStatus.canceladas,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Compras</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie requisicoes de compra, cotacoes e pedidos desta obra.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className="cursor-pointer"
        >
          + Nova Requisicao
        </Button>
      </div>

      {/* New Requisicao Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nova Requisicao de Compra</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <RequisicaoForm
              obraId={obraId}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex border-b gap-0.5 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count = badgeCount[tab.key]

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap -mb-px cursor-pointer ${
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count != null && count > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs min-w-[1.25rem] h-5 px-1">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Refresh indicator */}
      {isRefreshing && (
        <p className="text-xs text-muted-foreground animate-pulse">Atualizando...</p>
      )}

      {/* Content */}
      {filteredRequisicoes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {activeTab === "todas"
              ? "Nenhuma requisicao de compra criada ainda."
              : "Nenhuma requisicao com este status."}
          </p>
          {activeTab === "todas" && (
            <Button
              variant="outline"
              className="mt-3 cursor-pointer"
              onClick={() => setShowForm(true)}
            >
              Criar primeira requisicao
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRequisicoes.map((req) => (
            <RequisicaoCard
              key={req.id}
              requisicao={{
                ...req,
                obraId,
                urgente: false,
              }}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
