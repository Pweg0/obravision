"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DepositoSelector } from "@/components/estoque/DepositoSelector"
import { EstoqueTable } from "@/components/estoque/EstoqueTable"
import { EstoqueAlerts } from "@/components/estoque/EstoqueAlerts"
import { MovimentacaoForm } from "@/components/estoque/MovimentacaoForm"

interface Deposito {
  id: string
  nome: string
  tipo: string
}

interface EstoqueItem {
  descricao: string
  unidade: string
  saldo: number
  quantidadeMinima: number | null
}

interface EstoqueClientProps {
  obraId: string
  depositos: Deposito[]
  initialItems: EstoqueItem[]
  initialDepositoId: string | null
}

export function EstoqueClient({
  obraId,
  depositos,
  initialItems,
  initialDepositoId,
}: EstoqueClientProps) {
  const [selectedDepositoId, setSelectedDepositoId] = useState<string | null>(initialDepositoId)
  const [items] = useState<EstoqueItem[]>(initialItems)
  const [showMovimentacaoForm, setShowMovimentacaoForm] = useState(false)
  const router = useRouter()

  const lowStockAlerts = items
    .filter((item) => item.quantidadeMinima !== null && item.saldo < item.quantidadeMinima)
    .map((item) => ({
      descricao: item.descricao,
      saldo: item.saldo,
      quantidadeMinima: item.quantidadeMinima!,
    }))

  function handleDepositoSelect(id: string) {
    setSelectedDepositoId(id)
    router.push(`/dashboard/obras/${obraId}/estoque?deposito=${id}`)
  }

  function handleMovimentacaoSuccess() {
    setShowMovimentacaoForm(false)
    router.refresh()
  }

  if (depositos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Estoque</h2>
        </div>
        <div className="rounded-lg border border-dashed p-12 text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            Nenhum deposito criado. Crie um deposito para comecar a gerenciar o estoque.
          </p>
          <DepositoSelector
            obraId={obraId}
            depositos={[]}
            selectedId={null}
            onSelect={handleDepositoSelect}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Estoque</h2>
        {selectedDepositoId && (
          <Button onClick={() => setShowMovimentacaoForm(true)}>
            Registrar Movimentacao
          </Button>
        )}
      </div>

      {/* Deposito Selector */}
      <DepositoSelector
        obraId={obraId}
        depositos={depositos}
        selectedId={selectedDepositoId}
        onSelect={handleDepositoSelect}
      />

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <EstoqueAlerts initialAlerts={lowStockAlerts} obraId={obraId} />
      )}

      {/* Estoque Table */}
      {selectedDepositoId ? (
        <EstoqueTable items={items} />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground">Selecione um deposito para ver o estoque</p>
        </div>
      )}

      {/* Movimentacao Modal */}
      {showMovimentacaoForm && selectedDepositoId && (
        <MovimentacaoForm
          depositoId={selectedDepositoId}
          depositos={depositos}
          onSuccess={handleMovimentacaoSuccess}
          onClose={() => setShowMovimentacaoForm(false)}
        />
      )}
    </div>
  )
}
