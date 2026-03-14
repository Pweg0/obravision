"use client"

import { useState, useTransition } from "react"
import { createMedicaoFisica } from "@/lib/actions/medicoes"

interface MedicaoFisicaFormProps {
  obraId: string
  orcamentoId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function MedicaoFisicaForm({
  obraId,
  orcamentoId,
  onSuccess,
  onCancel,
}: MedicaoFisicaFormProps) {
  const [periodo, setPeriodo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // periodo input is "YYYY-MM" from date input (month type)
    if (!periodo) {
      setError("Selecione o periodo")
      return
    }

    startTransition(async () => {
      const result = await createMedicaoFisica({ obraId, orcamentoId, periodo })
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
          Periodo <span className="text-destructive">*</span>
        </label>
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Selecione o mes/ano de referencia desta medicao
        </p>
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
          {isPending ? "Criando..." : "Criar Medicao Fisica"}
        </button>
      </div>
    </form>
  )
}
