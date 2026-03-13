"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createEtapa, updateEtapa, deleteEtapa } from "@/lib/actions/cronograma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EtapaData {
  id: string
  nome: string
  ordem: number
  climaSensivel: boolean
}

interface EtapaFormProps {
  obraId: string
  etapa?: EtapaData | null
  nextOrdem?: number
  onClose: () => void
}

export function EtapaForm({ obraId, etapa, nextOrdem = 1, onClose }: EtapaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isEditing = !!etapa

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const nome = formData.get("nome") as string
    const ordem = parseInt(formData.get("ordem") as string, 10)
    const climaSensivel = formData.get("climaSensivel") === "on"

    startTransition(async () => {
      let result
      if (isEditing) {
        result = await updateEtapa(etapa.id, { nome, ordem, climaSensivel })
      } else {
        result = await createEtapa({ obraId, nome, ordem, climaSensivel })
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
    startTransition(async () => {
      if (!etapa) return
      const result = await deleteEtapa(etapa.id)
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
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Editar Etapa" : "Nova Etapa"}
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
          <div className="space-y-1">
            <Label htmlFor="nome">Nome da Etapa</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Fundacao, Alvenaria, Acabamento"
              defaultValue={etapa?.nome ?? ""}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="ordem">Ordem</Label>
            <Input
              id="ordem"
              name="ordem"
              type="number"
              min="0"
              defaultValue={etapa?.ordem ?? nextOrdem}
              required
            />
            <p className="text-xs text-muted-foreground">
              Define a posicao desta etapa no Gantt
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="climaSensivel"
              name="climaSensivel"
              defaultChecked={etapa?.climaSensivel ?? false}
              className="h-4 w-4 rounded border-input accent-[#1A6B5A]"
            />
            <Label htmlFor="climaSensivel" className="cursor-pointer">
              Etapa sensivel ao clima
              <span className="block text-xs text-muted-foreground font-normal">
                Tarefas desta etapa herdao sensibilidade ao clima por padrao
              </span>
            </Label>
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
              {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Etapa"}
            </Button>
          </div>
        </form>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-xl border shadow-lg w-full max-w-sm p-6 space-y-4">
              <h3 className="font-semibold">Excluir etapa?</h3>
              <p className="text-sm text-muted-foreground">
                A etapa sera removida permanentemente. Etapas com tarefas nao podem ser excluidas.
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
