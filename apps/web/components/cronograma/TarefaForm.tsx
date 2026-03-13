"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTarefa, updateTarefa, deleteTarefa } from "@/lib/actions/cronograma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TarefaData {
  id: string
  nome: string
  etapaId: string
  startDate: Date
  endDate: Date
  responsavelId: string | null
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA"
  climaSensivel: boolean | null
}

interface Member {
  id: string
  userId: string
  role: string
  user?: { id: string; name: string | null; email: string | null; image: string | null }
}

interface TarefaFormProps {
  obraId: string
  etapaId: string
  etapas: { id: string; nome: string }[]
  tarefa?: TarefaData | null
  members: Member[]
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluida",
  ATRASADA: "Atrasada",
}

function toInputDate(d: Date): string {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
}

export function TarefaForm({
  obraId,
  etapaId,
  etapas,
  tarefa,
  members,
  onClose,
}: TarefaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedEtapaId, setSelectedEtapaId] = useState(tarefa?.etapaId ?? etapaId)

  const isEditing = !!tarefa

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const nome = formData.get("nome") as string
    const startDate = new Date(formData.get("startDate") as string)
    const endDate = new Date(formData.get("endDate") as string)
    const responsavelId = (formData.get("responsavelId") as string) || null
    const status = formData.get("status") as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA"
    const climaSensivelRaw = formData.get("climaSensivel") as string
    const climaSensivel =
      climaSensivelRaw === "true" ? true : climaSensivelRaw === "false" ? false : null

    startTransition(async () => {
      let result
      if (isEditing) {
        result = await updateTarefa(tarefa.id, {
          nome,
          status,
          responsavelId,
          climaSensivel,
        })
      } else {
        result = await createTarefa({
          obraId,
          etapaId: selectedEtapaId,
          nome,
          startDate,
          endDate,
          responsavelId: responsavelId ?? undefined,
          status,
          climaSensivel,
        })
      }

      if (result && "error" in result) {
        setError(result.error)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  async function handleDelete() {
    if (!tarefa) return
    startTransition(async () => {
      const result = await deleteTarefa(tarefa.id)
      if (result && "error" in result) {
        setError(result.error)
        setShowDeleteConfirm(false)
      } else {
        router.refresh()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Etapa selection (only on create) */}
          {!isEditing && etapas.length > 1 && (
            <div className="space-y-1">
              <Label htmlFor="etapaSelect">Etapa</Label>
              <select
                id="etapaSelect"
                value={selectedEtapaId}
                onChange={(e) => setSelectedEtapaId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {etapas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1">
            <Label htmlFor="nome">Nome da Tarefa</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Concretagem, Eletrica, Pintura"
              defaultValue={tarefa?.nome ?? ""}
              required
            />
          </div>

          {/* Dates — only shown on create */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startDate">Data de inicio</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={toInputDate(new Date())}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate">Data de termino</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={toInputDate(new Date())}
                  required
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={tarefa?.status ?? "PENDENTE"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Responsavel */}
          <div className="space-y-1">
            <Label htmlFor="responsavelId">Responsavel</Label>
            <select
              id="responsavelId"
              name="responsavelId"
              defaultValue={tarefa?.responsavelId ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Sem responsavel</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name ?? m.user?.email ?? m.userId}
                </option>
              ))}
            </select>
          </div>

          {/* Clima sensivel */}
          <div className="space-y-1">
            <Label htmlFor="climaSensivel">Sensibilidade ao clima</Label>
            <select
              id="climaSensivel"
              name="climaSensivel"
              defaultValue={
                tarefa?.climaSensivel === null || tarefa?.climaSensivel === undefined
                  ? ""
                  : String(tarefa.climaSensivel)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Herdar da etapa</option>
              <option value="true">Sensivel (sim)</option>
              <option value="false">Nao sensivel (nao)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
              >
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white"
              style={{ backgroundColor: "#1A6B5A" }}
              disabled={isPending}
            >
              {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Tarefa"}
            </Button>
          </div>
        </form>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-xl border shadow-lg w-full max-w-sm p-6 space-y-4">
              <h3 className="font-semibold">Excluir tarefa?</h3>
              <p className="text-sm text-muted-foreground">
                A tarefa sera removida permanentemente.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
