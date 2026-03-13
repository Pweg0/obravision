"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { acceptInvite } from "@/lib/actions/invite"
import { Button } from "@/components/ui/button"

function AcceptButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Aceitando convite..." : "Aceitar convite"}
    </Button>
  )
}

export function AcceptInviteClient({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setError(null)
    const result = await acceptInvite(token)
    if (result?.error) {
      setError(result.error)
    }
    // On success, acceptInvite redirects automatically
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      <form action={handleAccept}>
        <AcceptButton />
      </form>
      <a
        href="/dashboard"
        className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Rejeitar
      </a>
    </div>
  )
}
