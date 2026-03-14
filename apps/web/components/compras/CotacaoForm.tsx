"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FornecedorSelect } from "./FornecedorSelect"
import { addCotacao } from "@/lib/actions/compras"

interface Fornecedor {
  id: string
  nome: string
  cnpj?: string | null
  categorias: string[]
}

interface CotacaoFormProps {
  requisicaoId: string
  fornecedores: Fornecedor[]
  obraId: string
  onSuccess: () => void
  onCancel: () => void
}

export function CotacaoForm({
  requisicaoId,
  fornecedores,
  obraId,
  onSuccess,
  onCancel,
}: CotacaoFormProps) {
  const [fornecedorId, setFornecedorId] = useState("")
  const [precoUnitario, setPrecoUnitario] = useState("")
  const [prazoEntrega, setPrazoEntrega] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fornecedorId) {
      setError("Selecione um fornecedor")
      return
    }

    const preco = parseFloat(precoUnitario)
    if (isNaN(preco) || preco <= 0) {
      setError("Preco unitario invalido")
      return
    }

    startTransition(async () => {
      const result = await addCotacao({
        requisicaoId,
        fornecedorId,
        precoUnitario: preco,
        prazoEntrega: prazoEntrega ? parseInt(prazoEntrega) : undefined,
        observacoes: observacoes || undefined,
      })
      if ("error" in result) {
        setError(result.error ?? "Erro desconhecido")
      } else {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FornecedorSelect
        fornecedores={fornecedores}
        value={fornecedorId}
        onChange={setFornecedorId}
        label="Fornecedor"
        required
      />

      <div className="space-y-1">
        <Label htmlFor="cot-preco">Preco Unitario (R$) *</Label>
        <Input
          id="cot-preco"
          type="number"
          step="0.01"
          min="0.01"
          value={precoUnitario}
          onChange={(e) => setPrecoUnitario(e.target.value)}
          placeholder="0,00"
          required
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cot-prazo">Prazo de Entrega (dias)</Label>
        <Input
          id="cot-prazo"
          type="number"
          min="1"
          value={prazoEntrega}
          onChange={(e) => setPrazoEntrega(e.target.value)}
          placeholder="Ex: 7"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cot-obs">Observacoes</Label>
        <textarea
          id="cot-obs"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Condicao de pagamento, validade da cotacao..."
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adicionando..." : "Adicionar Cotacao"}
        </Button>
      </div>
    </form>
  )
}
