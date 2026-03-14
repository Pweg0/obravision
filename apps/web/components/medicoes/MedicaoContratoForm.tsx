"use client"

import { useState, useTransition } from "react"
import { createMedicaoContrato } from "@/lib/actions/medicoes"

interface MedicaoContratoFormProps {
  obraId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function MedicaoContratoForm({ obraId, onSuccess, onCancel }: MedicaoContratoFormProps) {
  const [empreiteiroNome, setEmpreiteiroNome] = useState("")
  const [empreiteiroCnpj, setEmpreiteiroCnpj] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!empreiteiroNome.trim()) {
      setError("Nome do empreiteiro obrigatorio")
      return
    }
    if (!periodo) {
      setError("Selecione o periodo")
      return
    }

    startTransition(async () => {
      const result = await createMedicaoContrato({
        obraId,
        empreiteiroNome: empreiteiroNome.trim(),
        empreiteiroCnpj: empreiteiroCnpj.trim() || undefined,
        periodo,
      })
      if ("error" in result) {
        setError(result.error ?? "Erro ao criar medicao")
      } else {
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Nome do Empreiteiro <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={empreiteiroNome}
          onChange={(e) => setEmpreiteiroNome(e.target.value)}
          placeholder="Ex: Construtora Silva Ltda"
          className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">CNPJ</label>
        <input
          type="text"
          value={empreiteiroCnpj}
          onChange={(e) => setEmpreiteiroCnpj(e.target.value)}
          placeholder="00.000.000/0000-00 (opcional)"
          className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Periodo <span className="text-destructive">*</span>
        </label>
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md border hover:bg-muted transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Criando..." : "Criar Medicao de Contrato"}
        </button>
      </div>
    </form>
  )
}
