"use client"

import { useFormStatus } from "react-dom"
import { completeOnboarding } from "@/lib/actions/onboarding"
import { Button } from "@/components/ui/button"

function SkipButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" disabled={pending} className="w-full">
      {pending ? "Redirecionando..." : "Pular por agora"}
    </Button>
  )
}

export function StepEquipe() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Convide sua equipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione engenheiros, clientes ou outros administradores. Voce pode fazer isso depois tambem.
        </p>
      </div>

      {/* Invite components are rendered on the page with obraId from latest obra */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Para convidar membros, acesse a pagina da obra apos finalizar o cadastro.
        </p>
      </div>

      <form action={completeOnboarding}>
        <SkipButton />
      </form>
    </div>
  )
}
