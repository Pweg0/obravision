"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createShareableLink, regenerateShareableLink } from "@/lib/actions/invite"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ShareableLinkProps {
  obraId?: string
}

function GenerateButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Gerando..." : "Gerar link"}
    </Button>
  )
}

function formatExpiry(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function ShareableLink({ obraId }: ShareableLinkProps) {
  const [linkData, setLinkData] = useState<{
    url: string
    inviteId: string
    expiresAt: Date
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  async function handleGenerate(formData: FormData) {
    setError(null)
    if (obraId) formData.set("obraId", obraId)
    const result = await createShareableLink(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.url && result?.invitation) {
      setLinkData({
        url: result.url,
        inviteId: result.invitation.id,
        expiresAt: result.invitation.expiresAt,
      })
    }
  }

  async function handleCopy() {
    if (!linkData?.url) return
    await navigator.clipboard.writeText(linkData.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    if (!linkData?.inviteId) return
    setRegenerating(true)
    const result = await regenerateShareableLink(linkData.inviteId)
    if (result?.url && result?.invitation) {
      setLinkData({
        url: result.url,
        inviteId: result.invitation.id,
        expiresAt: result.invitation.expiresAt,
      })
    }
    setRegenerating(false)
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h4 className="font-medium text-sm">Link compartilhavel</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Qualquer pessoa com este link pode aceitar o convite. Valido por 30 dias.
        </p>
      </div>

      {!linkData ? (
        <form action={handleGenerate} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="link-role" className="text-xs">Papel</Label>
            <select
              id="link-role"
              name="role"
              required
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ENGENHEIRO">Engenheiro</option>
              <option value="ADMIN">Administrador</option>
              <option value="CLIENTE">Cliente</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <GenerateButton />
        </form>
      ) : (
        <div className="space-y-3">
          {/* Active indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              Ativo — expira em {formatExpiry(linkData.expiresAt)}
            </span>
          </div>

          {/* Link display */}
          <div className="flex gap-2">
            <input
              readOnly
              value={linkData.url}
              className="flex h-9 flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono text-muted-foreground"
            />
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-xs text-muted-foreground"
          >
            {regenerating ? "Regenerando..." : "Regenerar link (invalida o anterior)"}
          </Button>
        </div>
      )}
    </div>
  )
}
