"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addMovimentacao } from "@/lib/actions/estoque"

interface Deposito {
  id: string
  nome: string
}

interface MovimentacaoFormProps {
  depositoId: string
  depositos: Deposito[]
  onSuccess: () => void
  onClose: () => void
}

type MovimentacaoTipo = "ENTRADA" | "SAIDA" | "TRANSFERENCIA"

export function MovimentacaoForm({ depositoId, depositos, onSuccess, onClose }: MovimentacaoFormProps) {
  const [tipo, setTipo] = useState<MovimentacaoTipo>("ENTRADA")
  const [descricao, setDescricao] = useState("")
  const [unidade, setUnidade] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [quantidadeMinima, setQuantidadeMinima] = useState("")
  const [depositoDestinoId, setDepositoDestinoId] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const outrosDepositos = depositos.filter((d) => d.id !== depositoId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const qtd = parseFloat(quantidade)
    if (isNaN(qtd) || qtd <= 0) {
      setError("Quantidade deve ser um numero positivo")
      return
    }

    startTransition(async () => {
      const result = await addMovimentacao({
        depositoId,
        tipo,
        descricao: descricao.trim(),
        unidade: unidade.trim(),
        quantidade: qtd,
        quantidadeMinima: tipo === "ENTRADA" && quantidadeMinima ? parseFloat(quantidadeMinima) : undefined,
        depositoDestinoId: tipo === "TRANSFERENCIA" ? depositoDestinoId : undefined,
        observacoes: observacoes.trim() || undefined,
      })

      if (result && "error" in result) {
        setError(result.error ?? "Erro desconhecido")
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Registrar Movimentacao</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <Label htmlFor="tipo" className="text-sm font-medium mb-1 block">Tipo</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as MovimentacaoTipo)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm cursor-pointer"
            >
              <option value="ENTRADA">Entrada (compra/devolucao)</option>
              <option value="SAIDA">Saida (uso/perda)</option>
              <option value="TRANSFERENCIA">Transferencia entre depositos</option>
            </select>
          </div>

          {/* Descricao */}
          <div>
            <Label htmlFor="descricao" className="text-sm font-medium mb-1 block">Material / Descricao</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Cimento CP-II"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Unidade */}
            <div>
              <Label htmlFor="unidade" className="text-sm font-medium mb-1 block">Unidade</Label>
              <Input
                id="unidade"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="Ex: sc, kg, m"
                required
              />
            </div>

            {/* Quantidade */}
            <div>
              <Label htmlFor="quantidade" className="text-sm font-medium mb-1 block">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                step="0.01"
                min="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Quantidade Minima - only for ENTRADA */}
          {tipo === "ENTRADA" && (
            <div>
              <Label htmlFor="quantidadeMinima" className="text-sm font-medium mb-1 block">
                Quantidade Minima (opcional)
              </Label>
              <Input
                id="quantidadeMinima"
                type="number"
                step="0.01"
                min="0"
                value={quantidadeMinima}
                onChange={(e) => setQuantidadeMinima(e.target.value)}
                placeholder="Limite de alerta de estoque baixo"
              />
            </div>
          )}

          {/* Deposito Destino - only for TRANSFERENCIA */}
          {tipo === "TRANSFERENCIA" && (
            <div>
              <Label htmlFor="depositoDestino" className="text-sm font-medium mb-1 block">
                Deposito Destino
              </Label>
              {outrosDepositos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum outro deposito disponivel</p>
              ) : (
                <select
                  id="depositoDestino"
                  value={depositoDestinoId}
                  onChange={(e) => setDepositoDestinoId(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm cursor-pointer"
                  required
                >
                  <option value="">Selecionar deposito destino...</option>
                  {outrosDepositos.map((dep) => (
                    <option key={dep.id} value={dep.id}>{dep.nome}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Observacoes */}
          <div>
            <Label htmlFor="observacoes" className="text-sm font-medium mb-1 block">
              Observacoes (opcional)
            </Label>
            <Input
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas adicionais..."
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
