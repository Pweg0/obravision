"use client"

import { useState, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { importFromSheet } from "@/lib/actions/orcamento"

interface ImportModalProps {
  etapaId: string
  etapaNome: string
  onSuccess: (count: number) => void
  onCancel: () => void
}

export function ImportModal({ etapaId, etapaNome, onSuccess, onCancel }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError(null)
  }

  function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError("Selecione um arquivo")
      return
    }
    setError(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("etapaId", etapaId)

      const result = await importFromSheet(formData)
      if ("error" in result) {
        setError(result.error)
      } else if (result.success) {
        onSuccess(result.count ?? 0)
      }
    })
  }

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Importar itens para a etapa: <span className="font-medium text-foreground">{etapaNome}</span>
        </p>
      </div>
      <div className="rounded-md border border-dashed p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          Formato esperado: colunas <code>Descricao</code>, <code>Unidade</code>,{" "}
          <code>Quantidade</code>, <code>Custo Unitario</code>
        </p>
        <Label htmlFor="import-file">Arquivo XLSX ou CSV</Label>
        <input
          id="import-file"
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground cursor-pointer"
        />
        {file && (
          <p className="text-xs text-muted-foreground">Selecionado: {file.name}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || !file}>
          {isPending ? "Importando..." : "Importar"}
        </Button>
      </div>
    </form>
  )
}
