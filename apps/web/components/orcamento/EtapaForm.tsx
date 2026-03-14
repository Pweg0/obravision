"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEtapa } from "@/lib/actions/orcamento"

interface EtapaFormProps {
  orcamentoId: string
  nextOrdem: number
  onSuccess: () => void
  onCancel: () => void
}

export function EtapaForm({ orcamentoId, nextOrdem, onSuccess, onCancel }: EtapaFormProps) {
  const [nome, setNome] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createEtapa({ orcamentoId, nome, ordem: nextOrdem })
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
        <Label htmlFor="etapa-nome">Nome da Etapa</Label>
        <Input
          id="etapa-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Fundacao, Alvenaria, Cobertura..."
          required
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar Etapa"}
        </Button>
      </div>
    </form>
  )
}
