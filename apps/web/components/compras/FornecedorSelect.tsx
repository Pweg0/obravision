"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FornecedorForm } from "./FornecedorForm"

interface Fornecedor {
  id: string
  nome: string
  cnpj?: string | null
  categorias: string[]
}

interface FornecedorSelectProps {
  fornecedores: Fornecedor[]
  value: string
  onChange: (id: string) => void
  label?: string
  required?: boolean
}

export function FornecedorSelect({
  fornecedores,
  value,
  onChange,
  label = "Fornecedor",
  required,
}: FornecedorSelectProps) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [localFornecedores, setLocalFornecedores] = useState(fornecedores)

  function handleNewFornecedor(newFornecedor: Fornecedor) {
    setLocalFornecedores((prev) => [...prev, newFornecedor])
    onChange(newFornecedor.id)
    setShowNewForm(false)
  }

  if (showNewForm) {
    return (
      <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Novo Fornecedor</p>
          <button
            type="button"
            onClick={() => setShowNewForm(false)}
            className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
          >
            Cancelar
          </button>
        </div>
        <FornecedorForm
          onSuccess={handleNewFornecedor}
          onCancel={() => setShowNewForm(false)}
          compact
        />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Label>{label}{required && " *"}</Label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Selecionar fornecedor...</option>
          {localFornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}{f.cnpj ? ` — ${f.cnpj}` : ""}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNewForm(true)}
          className="shrink-0 cursor-pointer"
        >
          + Novo
        </Button>
      </div>
    </div>
  )
}
