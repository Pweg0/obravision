"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { REQUISICAO_STATUS_CONFIG } from "@/components/compras/RequisicaoCard"
import { CotacaoForm } from "@/components/compras/CotacaoForm"
import { MapaComparativo } from "@/components/compras/MapaComparativo"
import { PedidoCard } from "@/components/compras/PedidoCard"
import { approveRequisicao, rejectRequisicao, listCotacoes } from "@/lib/actions/compras"

interface Fornecedor {
  id: string
  nome: string
  cnpj?: string | null
  categorias: string[]
}

interface Cotacao {
  id: string
  requisicaoId: string
  fornecedorId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  precoUnitario: any
  prazoEntrega?: number | null
  observacoes?: string | null
  fornecedor: {
    id: string
    nome: string
    cnpj?: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categorias: any
  }
}

interface Requisicao {
  id: string
  obraId: string
  descricao: string
  // Prisma Decimal arrives as Decimal object | string | number depending on context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quantidade: any
  unidade: string
  status: string
  solicitanteId: string
  aprovadorId?: string | null
  aprovadoEm?: Date | string | null
  createdAt: Date | string
  orcamentoItem?: {
    id: string
    descricao: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quantidade: any
    unidade: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    custoUnitario: any
  } | null
}

interface RequisicaoDetailClientProps {
  obraId: string
  requisicao: Requisicao
  initialCotacoes: Cotacao[]
  fornecedores: Fornecedor[]
  currentUserRole: string
  currentUserId: string
}

export function RequisicaoDetailClient({
  obraId,
  requisicao,
  initialCotacoes,
  fornecedores,
  currentUserRole,
  currentUserId,
}: RequisicaoDetailClientProps) {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(initialCotacoes)
  const [showCotacaoForm, setShowCotacaoForm] = useState(false)
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [isPendingApprove, startApproveTransition] = useTransition()
  const [isPendingReject, startRejectTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const statusConfig = REQUISICAO_STATUS_CONFIG[requisicao.status] ?? REQUISICAO_STATUS_CONFIG.RASCUNHO
  const canManage = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"
  const canApprove = canManage && requisicao.status === "PENDENTE"
  const canAddCotacao = canManage && ["APROVADA", "PENDENTE"].includes(requisicao.status)

  const qtd = parseFloat(String(requisicao.quantidade))
  const createdAt = new Date(requisicao.createdAt)

  function refreshCotacoes() {
    startRefreshTransition(async () => {
      const data = await listCotacoes(requisicao.id)
      setCotacoes(data as Cotacao[])
    })
  }

  function handleCotacaoSuccess() {
    setShowCotacaoForm(false)
    refreshCotacoes()
  }

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

  // MapaComparativo needs RequisicaoItem[] format
  const mapaItems = [{
    id: requisicao.id,
    descricao: requisicao.descricao,
    quantidade: qtd,
    unidade: requisicao.unidade,
  }]

  // Remap cotacoes for mapa: requisicaoId should be the main requisicao id
  const mapaCtacoes = cotacoes.map((c) => ({
    ...c,
    requisicaoId: requisicao.id,
  }))

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.color}40`,
                }}
              >
                {statusConfig.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {createdAt.toLocaleDateString("pt-BR", { dateStyle: "long" })}
              </span>
            </div>
            <h1 className="text-xl font-semibold">{requisicao.descricao}</h1>
            <p className="text-muted-foreground">
              Quantidade: <strong>{qtd.toLocaleString("pt-BR")} {requisicao.unidade}</strong>
            </p>

            {/* Orcamento item link */}
            {requisicao.orcamentoItem && (
              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium text-muted-foreground text-xs mb-0.5">Vinculado ao Orcamento</p>
                <p>{requisicao.orcamentoItem.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  Orcado: {parseFloat(String(requisicao.orcamentoItem.quantidade)).toLocaleString("pt-BR")} {requisicao.orcamentoItem.unidade}
                </p>
              </div>
            )}
          </div>

          {canApprove && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50 cursor-pointer"
                onClick={handleApprove}
                disabled={isPendingApprove || isPendingReject}
              >
                {isPendingApprove ? "Aprovando..." : "Aprovar"}
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                onClick={handleReject}
                disabled={isPendingApprove || isPendingReject}
              >
                {isPendingReject ? "Rejeitando..." : "Rejeitar"}
              </Button>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Cotacoes section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Cotacoes ({cotacoes.length})</h2>
          {canAddCotacao && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCotacaoForm(true)}
              disabled={showCotacaoForm}
              className="cursor-pointer"
            >
              + Adicionar Cotacao
            </Button>
          )}
        </div>

        {/* Cotacao form modal */}
        {showCotacaoForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Adicionar Cotacao</h3>
                <button
                  onClick={() => setShowCotacaoForm(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <CotacaoForm
                requisicaoId={requisicao.id}
                fornecedores={fornecedores}
                obraId={obraId}
                onSuccess={handleCotacaoSuccess}
                onCancel={() => setShowCotacaoForm(false)}
              />
            </div>
          </div>
        )}

        {/* Cotacao list */}
        {cotacoes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhuma cotacao adicionada ainda.
            {canAddCotacao && " Clique em \"+ Adicionar Cotacao\" para comecar."}
          </div>
        ) : (
          <div className="space-y-2">
            {cotacoes.map((cotacao) => {
              const preco = parseFloat(String(cotacao.precoUnitario))
              return (
                <div key={cotacao.id} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{cotacao.fornecedor.nome}</p>
                    {cotacao.prazoEntrega && (
                      <p className="text-xs text-muted-foreground">
                        Prazo: {cotacao.prazoEntrega} dias
                      </p>
                    )}
                    {cotacao.observacoes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{cotacao.observacoes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">
                      {preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-muted-foreground">por {requisicao.unidade}</p>
                    <p className="text-xs text-muted-foreground">
                      Total: {(preco * qtd).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Mapa comparativo — shown when 2+ suppliers */}
        {cotacoes.length >= 2 && (
          <MapaComparativo
            obraId={obraId}
            items={mapaItems}
            cotacoes={mapaCtacoes}
          />
        )}
      </div>
    </div>
  )
}
