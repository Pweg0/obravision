import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { AcceptInviteClient } from "./AcceptInviteClient"

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const session = await auth()

  // If not logged in, redirect to register with invite token
  if (!session?.user?.id) {
    redirect(`/register?invite=${token}`)
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { empresa: true, obra: true },
  })

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">🔗</div>
          <h1 className="text-xl font-bold">Convite invalido</h1>
          <p className="text-sm text-muted-foreground">
            Este link de convite nao existe ou foi removido.
          </p>
          <a href="/dashboard" className="text-primary text-sm hover:underline">
            Ir para o dashboard
          </a>
        </div>
      </div>
    )
  }

  if (invitation.usedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-bold">Convite ja utilizado</h1>
          <p className="text-sm text-muted-foreground">
            Este convite ja foi aceito anteriormente.
          </p>
          <a href="/dashboard" className="text-primary text-sm hover:underline">
            Ir para o dashboard
          </a>
        </div>
      </div>
    )
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">⏰</div>
          <h1 className="text-xl font-bold">Convite expirado</h1>
          <p className="text-sm text-muted-foreground">
            Este convite expirou. Solicite um novo convite ao administrador.
          </p>
          <a href="/dashboard" className="text-primary text-sm hover:underline">
            Ir para o dashboard
          </a>
        </div>
      </div>
    )
  }

  if (invitation.email && invitation.email !== session.user.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">🚫</div>
          <h1 className="text-xl font-bold">Convite para outro email</h1>
          <p className="text-sm text-muted-foreground">
            Este convite foi enviado para <strong>{invitation.email}</strong>.
            Voce esta logado com <strong>{session.user.email}</strong>.
          </p>
          <a href="/login" className="text-primary text-sm hover:underline">
            Entrar com outro email
          </a>
        </div>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    ENGENHEIRO: "Engenheiro",
    CLIENTE: "Cliente",
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">ObraVision</h1>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Voce foi convidado!</h2>
            <p className="text-sm text-muted-foreground">
              Para participar de <strong>{invitation.empresa.nome}</strong>
              {invitation.obra && ` — ${invitation.obra.nome}`} como{" "}
              <strong>{roleLabels[invitation.role] ?? invitation.role}</strong>.
            </p>
          </div>

          <AcceptInviteClient token={token} />
        </div>
      </div>
    </div>
  )
}
