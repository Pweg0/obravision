"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createDeposito } from "@/lib/actions/estoque"

interface Deposito {
  id: string
  nome: string
  tipo: string
}

interface DepositoSelectorProps {
  obraId: string
  depositos: Deposito[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function DepositoSelector({ obraId, depositos, selectedId, onSelect }: DepositoSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [nome, setNome] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreate() {
    if (!nome.trim()) {
      setError("Nome e obrigatorio")
      return
    }
    startTransition(async () => {
      const result = await createDeposito({ obraId, nome: nome.trim() })
      if (result && "error" in result) {
        setError(result.error)
      } else if (result && "deposito" in result) {
        setNome("")
        setShowCreateForm(false)
        setError(null)
        router.refresh()
        onSelect(result.deposito.id)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Deposito:</Label>
        <div className="flex gap-2 flex-wrap">
          {depositos.map((dep) => (
            <button
              key={dep.id}
              onClick={() => onSelect(dep.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                selectedId === dep.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70 text-foreground"
              }`}
            >
              {dep.nome}
            </button>
          ))}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1.5 rounded-md text-sm font-medium border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            + Novo Deposito
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="flex items-end gap-2 p-3 bg-muted/20 rounded-lg border">
          <div className="flex-1">
            <Label htmlFor="deposito-nome" className="text-xs text-muted-foreground mb-1 block">
              Nome do deposito
            </Label>
            <Input
              id="deposito-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Almoxarifado, Frente de Obra"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <Button size="sm" onClick={handleCreate} disabled={isPending} className="h-8">
            {isPending ? "Criando..." : "Criar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowCreateForm(false); setNome(""); setError(null) }}
            className="h-8"
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
