"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SinapiSearch } from "./SinapiSearch"
import { createItem } from "@/lib/actions/orcamento"

interface ItemFormProps {
  etapaId: string
  obraEstado?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ItemForm({ etapaId, obraEstado = "SP", onSuccess, onCancel }: ItemFormProps) {
  const [descricao, setDescricao] = useState("")
  const [unidade, setUnidade] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [custoUnitario, setCustoUnitario] = useState("")
  const [sinapiCodigo, setSinapiCodigo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSinapiSelect(result: {
    codigo: string
    descricao: string
    unidade: string
    custoUnitario: number
  }) {
    setSinapiCodigo(result.codigo)
    setDescricao(result.descricao)
    setUnidade(result.unidade)
    setCustoUnitario(String(result.custoUnitario))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const qtd = parseFloat(quantidade)
    const custo = parseFloat(custoUnitario)

    if (isNaN(qtd) || qtd <= 0) {
      setError("Quantidade deve ser um numero positivo")
      return
    }
    if (isNaN(custo) || custo < 0) {
      setError("Custo unitario invalido")
      return
    }

    startTransition(async () => {
      const result = await createItem({
        etapaId,
        descricao,
        unidade,
        quantidade: qtd,
        custoUnitario: custo,
        sinapiCodigo: sinapiCodigo || undefined,
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
      <div className="space-y-1">
        <Label>Buscar SINAPI (opcional)</Label>
        <SinapiSearch estado={obraEstado} onSelect={handleSinapiSelect} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="item-descricao">Descricao *</Label>
        <Input
          id="item-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Concreto fck 25 MPa"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="item-unidade">Unidade *</Label>
          <Input
            id="item-unidade"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            placeholder="m3, m2, kg, un..."
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="item-quantidade">Quantidade *</Label>
          <Input
            id="item-quantidade"
            type="number"
            min="0.0001"
            step="0.0001"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0,0000"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="item-custo">Custo Unitario (R$) *</Label>
        <Input
          id="item-custo"
          type="number"
          min="0"
          step="0.0001"
          value={custoUnitario}
          onChange={(e) => setCustoUnitario(e.target.value)}
          placeholder="0,0000"
          required
        />
      </div>
      {sinapiCodigo && (
        <p className="text-xs text-muted-foreground">Codigo SINAPI: {sinapiCodigo}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar Item"}
        </Button>
      </div>
    </form>
  )
}
