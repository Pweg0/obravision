"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createEmpresa } from "@/lib/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Criando..." : "Continuar"}
    </Button>
  )
}

export function StepEmpresa() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createEmpresa(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crie sua empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Como se chama sua construtora ou escritorio?
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da empresa</Label>
          <Input
            id="nome"
            name="nome"
            placeholder="Ex: Construtora Silva"
            required
            autoFocus
            className="text-base"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}
