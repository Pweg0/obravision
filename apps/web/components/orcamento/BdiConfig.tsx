"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateBdi } from "@/lib/actions/orcamento"

interface BdiConfigProps {
  orcamentoId: string
  currentBdi: number
}

export function BdiConfig({ orcamentoId, currentBdi }: BdiConfigProps) {
  const [bdi, setBdi] = useState(String(currentBdi))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const value = parseFloat(bdi)
    if (isNaN(value) || value < 0 || value > 100) {
      setError("BDI deve ser entre 0% e 100%")
      return
    }

    startTransition(async () => {
      const result = await updateBdi(orcamentoId, value)
      if ("error" in result) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="bdi-input">BDI (%)</Label>
        <div className="flex items-center gap-1">
          <Input
            id="bdi-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={bdi}
            onChange={(e) => setBdi(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar BDI"}
      </Button>
      {error && <p className="text-sm text-destructive self-end">{error}</p>}
    </form>
  )
}
