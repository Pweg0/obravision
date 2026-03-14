"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRequisicao } from "@/lib/actions/compras"

interface OrcamentoItemOption {
  id: string
  descricao: string
  unidade: string
  quantidade: string | number
  custoUnitario: string | number
}

interface RequisicaoFormProps {
  obraId: string
  orcamentoItens?: OrcamentoItemOption[]
  onSuccess: () => void
  onCancel: () => void
}

export function RequisicaoForm({ obraId, orcamentoItens = [], onSuccess, onCancel }: RequisicaoFormProps) {
  const [descricao, setDescricao] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [unidade, setUnidade] = useState("")
  const [urgente, setUrgente] = useState(false)
  const [observacoes, setObservacoes] = useState("")
  const [orcamentoItemId, setOrcamentoItemId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOrcamentoItemChange(itemId: string) {
    setOrcamentoItemId(itemId)
    if (itemId) {
      const item = orcamentoItens.find((i) => i.id === itemId)
      if (item) {
        setDescricao(item.descricao)
        setUnidade(item.unidade)
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const qtd = parseFloat(quantidade)
    if (isNaN(qtd) || qtd <= 0) {
      setError("Quantidade invalida")
      return
    }

    startTransition(async () => {
      const result = await createRequisicao({
        obraId,
        descricao,
        quantidade: qtd,
        unidade,
        urgente,
        observacoes: observacoes || undefined,
        orcamentoItemId: orcamentoItemId || undefined,
      })
      if ("error" in result) {
        setError(result.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Orcamento item selector */}
      {orcamentoItens.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="orcamento-item">Vincular a Item do Orcamento (opcional)</Label>
          <select
            id="orcamento-item"
            value={orcamentoItemId}
            onChange={(e) => handleOrcamentoItemChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecionar item do orcamento...</option>
            {orcamentoItens.map((item) => (
              <option key={item.id} value={item.id}>
                {item.descricao} ({item.unidade})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="req-descricao">Descricao *</Label>
        <Input
          id="req-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Cimento CP-II, Aco CA-50..."
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="req-quantidade">Quantidade *</Label>
          <Input
            id="req-quantidade"
            type="number"
            step="0.01"
            min="0.01"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="req-unidade">Unidade *</Label>
          <Input
            id="req-unidade"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            placeholder="sc, m3, kg..."
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="req-urgente"
          type="checkbox"
          checked={urgente}
          onChange={(e) => setUrgente(e.target.checked)}
          className="h-4 w-4 rounded border-input cursor-pointer"
        />
        <Label htmlFor="req-urgente" className="cursor-pointer font-normal">
          Marcada como urgente
        </Label>
      </div>

      <div className="space-y-1">
        <Label htmlFor="req-obs">Observacoes</Label>
        <textarea
          id="req-obs"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Informacoes adicionais sobre a requisicao..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Criando..." : "Criar Requisicao"}
        </Button>
      </div>
    </form>
  )
}
