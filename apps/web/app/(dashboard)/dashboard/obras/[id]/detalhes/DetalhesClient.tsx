"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ObraForm } from "@/components/obra/ObraForm"
import { StatusBadge } from "@/components/obra/StatusBadge"
import { archiveObra } from "@/lib/actions/obra"
import { Button } from "@/components/ui/button"

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface DetalhesClientProps {
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
  }
  statuses: ObraStatus[]
  currentUserRole: string
}

const TIPO_LABELS: Record<string, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  REFORMA: "Reforma",
}

export function DetalhesClient({
  obra,
  statuses,
  currentUserRole,
}: DetalhesClientProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const router = useRouter()

  const areaNum = parseFloat(String(obra.area))
  const canEdit = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"
  const canArchive = currentUserRole === "ADMIN"

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Detalhes</h1>
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

      {/* Details cards */}
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
