"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { inviteByEmail, listInvitations, revokeInvitation } from "@/lib/actions/invite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InviteByEmailProps {
  obraId?: string
}

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Enviando..." : "Enviar convite"}
    </Button>
  )
}

export function InviteByEmail({ obraId }: InviteByEmailProps) {
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setSuccess(null)
    setError(null)
    if (obraId) formData.set("obraId", obraId)
    const result = await inviteByEmail(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess("Convite enviado com sucesso!")
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h4 className="font-medium text-sm">Convidar por email</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          O convidado recebera um email com o link de acesso.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="w-36 space-y-1">
            <Label htmlFor="invite-role" className="text-xs">Papel</Label>
            <select
              id="invite-role"
              name="role"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ENGENHEIRO">Engenheiro</option>
              <option value="ADMIN">Administrador</option>
              <option value="CLIENTE">Cliente</option>
            </select>
          </div>
        </div>

        {success && <p className="text-sm text-green-600">{success}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <SendButton />
      </form>
    </div>
  )
}
