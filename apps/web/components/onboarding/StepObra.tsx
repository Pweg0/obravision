"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createFirstObra } from "@/lib/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ESTADOS_BRASILEIROS } from "@/lib/validations/obra"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Criando obra..." : "Continuar"}
    </Button>
  )
}

export function StepObra() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createFirstObra(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crie sua primeira obra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione os dados da obra que voce quer gerenciar.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da obra *</Label>
          <Input
            id="nome"
            name="nome"
            placeholder="Ex: Residencia Familia Souza"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="logradouro">Logradouro *</Label>
            <Input id="logradouro" name="logradouro" placeholder="Rua, Av., etc." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero">Numero *</Label>
            <Input id="numero" name="numero" placeholder="123" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input id="cidade" name="cidade" placeholder="Sao Paulo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <select
              id="estado"
              name="estado"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">UF</option>
              {ESTADOS_BRASILEIROS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP *</Label>
          <Input
            id="cep"
            name="cep"
            placeholder="00000000 (apenas numeros)"
            maxLength={8}
            pattern="[0-9]{8}"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <select
              id="tipo"
              name="tipo"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione</option>
              <option value="RESIDENCIAL">Residencial</option>
              <option value="COMERCIAL">Comercial</option>
              <option value="REFORMA">Reforma</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Area (m²) *</Label>
            <Input
              id="area"
              name="area"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="150.00"
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}
