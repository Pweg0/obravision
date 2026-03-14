"use client"

import { InviteByEmail } from "@/components/invite/InviteByEmail"
import { ShareableLink } from "@/components/invite/ShareableLink"

interface Member {
  id: string
  userId: string
  role: string
  user?: { id: string; name: string | null; email: string | null; image: string | null }
}

interface EquipeClientProps {
  obraId: string
  members: Member[]
  currentUserRole: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ENGENHEIRO: "Engenheiro",
  CLIENTE: "Cliente",
}

export function EquipeClient({ obraId, members, currentUserRole }: EquipeClientProps) {
  const canInvite = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Equipe</h1>

      {/* Current members list */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h3 className="font-medium text-sm">Membros ({members.length})</h3>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">Nenhum membro encontrado.</p>
        ) : (
          <ul className="divide-y">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{member.user?.name ?? member.user?.email ?? "Usuario"}</p>
                  <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite section */}
      {canInvite && (
        <div className="space-y-4">
          <h3 className="font-medium">Convidar membros</h3>
          <InviteByEmail obraId={obraId} />
          <ShareableLink obraId={obraId} />
        </div>
      )}
    </div>
  )
}
