"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createObra, updateObra } from "@/lib/actions/obra"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ESTADOS_BRASILEIROS } from "@/lib/validations/obra"

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface ObraFormProps {
  onSuccess?: () => void
  obra?: {
    id: string
    nome: string
    logradouro: string
    numero: string
    cidade: string
    estado: string
    cep: string
    tipo: string
    area: unknown
    statusId?: string | null
  }
  statuses?: ObraStatus[]
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar obra"}
    </Button>
  )
}

export function ObraForm({ obra, statuses = [], onSuccess }: ObraFormProps) {
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!obra

  async function handleSubmit(formData: FormData) {
    setError(null)

    const result = isEdit
      ? await updateObra(obra!.id, formData)
      : await createObra(formData)

    if (result && "error" in result && result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
    }
  }

  const areaValue = obra?.area ? parseFloat(String(obra.area)) : ""

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-nome">Nome da obra *</Label>
        <Input
          id="form-nome"
          name="nome"
          defaultValue={obra?.nome ?? ""}
          placeholder="Ex: Residencia Familia Souza"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="form-logradouro">Logradouro *</Label>
          <Input
            id="form-logradouro"
            name="logradouro"
            defaultValue={obra?.logradouro ?? ""}
            placeholder="Rua, Av., etc."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-numero">Numero *</Label>
          <Input
            id="form-numero"
            name="numero"
            defaultValue={obra?.numero ?? ""}
            placeholder="123"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="form-cidade">Cidade *</Label>
          <Input
            id="form-cidade"
            name="cidade"
            defaultValue={obra?.cidade ?? ""}
            placeholder="Sao Paulo"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-estado">Estado *</Label>
          <select
            id="form-estado"
            name="estado"
            defaultValue={obra?.estado ?? ""}
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
        <Label htmlFor="form-cep">CEP *</Label>
        <Input
          id="form-cep"
          name="cep"
          defaultValue={obra?.cep ?? ""}
          placeholder="00000000"
          maxLength={8}
          pattern="[0-9]{8}"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="form-tipo">Tipo *</Label>
          <select
            id="form-tipo"
            name="tipo"
            defaultValue={obra?.tipo ?? ""}
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
          <Label htmlFor="form-area">Area (m²) *</Label>
          <Input
            id="form-area"
            name="area"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={areaValue}
            placeholder="150.00"
            required
          />
        </div>
      </div>

      {isEdit && statuses.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="form-status">Status</Label>
          <select
            id="form-status"
            name="statusId"
            defaultValue={obra?.statusId ?? ""}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Sem status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <SubmitButton isEdit={isEdit} />
    </form>
  )
}
