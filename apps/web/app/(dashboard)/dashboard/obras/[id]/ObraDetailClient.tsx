"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ObraForm } from "@/components/obra/ObraForm"
import { StatusBadge } from "@/components/obra/StatusBadge"
import { InviteByEmail } from "@/components/invite/InviteByEmail"
import { ShareableLink } from "@/components/invite/ShareableLink"
import { StatusManager } from "./StatusManager"
import { archiveObra } from "@/lib/actions/obra"
import { Button } from "@/components/ui/button"

interface Member {
  id: string
  userId: string
  role: string
  user?: { id: string; name: string | null; email: string | null; image: string | null }
}

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface ObraDetailClientProps {
  obra: {
    id: string
    nome: string
    logradouro: string
    numero: string
    cidade: string
    estado: string
    cep: string
    tipo: string
    area: unknown
    archived: boolean
    status: ObraStatus | null
    statusId: string | null
    members: Member[]
  }
  statuses: ObraStatus[]
  currentUserRole: string
  empresaId: string
}

const TIPO_LABELS: Record<string, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  REFORMA: "Reforma",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ENGENHEIRO: "Engenheiro",
  CLIENTE: "Cliente",
}

export function ObraDetailClient({
  obra,
  statuses,
  currentUserRole,
  empresaId,
}: ObraDetailClientProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "members" | "statuses">("details")
  const obraId = obra.id
  const router = useRouter()

  const areaNum = parseFloat(String(obra.area))
  const canEdit = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"
  const canArchive = currentUserRole === "ADMIN"
  const canInvite = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"

  async function handleArchive() {
    setArchiving(true)
    await archiveObra(obra.id)
    router.push("/dashboard/obras")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard/obras" className="hover:text-foreground transition-colors">
              Obras
            </Link>
            <span>/</span>
            <span>{obra.nome}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{obra.nome}</h1>
            {obra.status && (
              <StatusBadge name={obra.status.name} color={obra.status.color} />
            )}
            {obra.archived && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                Arquivada
              </span>
            )}
          </div>
        </div>
        {canEdit && !obra.archived && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditForm(true)}>
              Editar
            </Button>
            {canArchive && (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowArchiveConfirm(true)}
              >
                Arquivar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex border-b gap-1">
        {(["details", "members", "statuses"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors -mb-px ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "details" ? "Detalhes" : tab === "members" ? "Equipe" : "Status"}
          </button>
        ))}
        <Link
          href={`/dashboard/obras/${obraId}/plantas`}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-px"
        >
          Plantas
        </Link>
        <Link
          href={`/dashboard/obras/${obraId}/cronograma`}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-px"
        >
          Cronograma
        </Link>
        <Link
          href={`/dashboard/obras/${obraId}/rdo`}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-px"
        >
          Diario de Obra
        </Link>
        <Link
          href={`/dashboard/obras/${obraId}/orcamento`}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-px"
        >
          Orcamento
        </Link>
        <Link
          href={`/dashboard/obras/${obraId}/compras`}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-px"
        >
          Compras
        </Link>
      </div>

      {/* Details tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Endereco
            </h3>
            <div className="space-y-1 text-sm">
              <p>{obra.logradouro}, {obra.numero}</p>
              <p>{obra.cidade} - {obra.estado}</p>
              <p>CEP: {obra.cep}</p>
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Informacoes
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span>{TIPO_LABELS[obra.tipo] ?? obra.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span>{areaNum.toLocaleString("pt-BR")} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                {obra.status ? (
                  <StatusBadge name={obra.status.name} color={obra.status.color} />
                ) : (
                  <span className="text-muted-foreground">Sem status</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members tab */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Current members list */}
          <div className="rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-medium text-sm">Membros ({obra.members.length})</h3>
            </div>
            {obra.members.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Nenhum membro encontrado.</p>
            ) : (
              <ul className="divide-y">
                {obra.members.map((member) => (
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
              <InviteByEmail obraId={obra.id} />
              <ShareableLink obraId={obra.id} />
            </div>
          )}
        </div>
      )}

      {/* Statuses tab */}
      {activeTab === "statuses" && (
        <StatusManager statuses={statuses} currentUserRole={currentUserRole} />
      )}

      {/* Edit modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Editar Obra</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ObraForm
              obra={{ ...obra, statusId: obra.statusId }}
              statuses={statuses}
              onSuccess={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {/* Archive confirmation modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Arquivar obra?</h2>
            <p className="text-sm text-muted-foreground">
              A obra sera movida para a aba Arquivadas. Voce pode restaura-la a qualquer momento.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleArchive}
                disabled={archiving}
              >
                {archiving ? "Arquivando..." : "Arquivar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
