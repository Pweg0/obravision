"use client"

import { useState } from "react"
import { createStatus, updateStatus, deleteStatus } from "@/lib/actions/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormStatus } from "react-dom"

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface StatusManagerProps {
  statuses: ObraStatus[]
  currentUserRole: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  )
}

export function StatusManager({ statuses, currentUserRole }: StatusManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAdmin = currentUserRole === "ADMIN"

  async function handleCreate(formData: FormData) {
    setError(null)
    const result = await createStatus(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowForm(false)
    }
  }

  async function handleUpdate(id: string, formData: FormData) {
    setError(null)
    const result = await updateStatus(id, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setEditingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteStatus(id)
    if (result?.error) {
      setError(result.error)
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Status personalizados ({statuses.length})</h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Novo Status
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-2">
        {statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
            {editingId === s.id ? (
              <form
                action={(fd) => handleUpdate(s.id, fd)}
                className="flex items-center gap-2 flex-1"
              >
                <input
                  name="name"
                  defaultValue={s.name}
                  className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <input
                  name="color"
                  type="color"
                  defaultValue={s.color}
                  className="h-8 w-10 rounded border border-input cursor-pointer"
                />
                <SubmitButton label="Salvar" />
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancelar
                </Button>
              </form>
            ) : (
              <>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-sm flex-1">{s.name}</span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(s.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === s.id ? "..." : "Excluir"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {showForm && isAdmin && (
        <div className="rounded-lg border p-4 space-y-3">
          <h4 className="text-sm font-medium">Novo status</h4>
          <form action={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="new-status-name" className="text-xs">Nome</Label>
              <Input id="new-status-name" name="name" placeholder="Ex: Em aprovacao" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-status-color" className="text-xs">Cor</Label>
              <div className="flex gap-2">
                <input
                  id="new-status-color"
                  name="color"
                  type="color"
                  defaultValue="#1A6B5A"
                  className="h-10 w-14 rounded border border-input cursor-pointer"
                />
                <Input
                  placeholder="#1A6B5A"
                  className="flex-1"
                  readOnly
                />
              </div>
            </div>
            <div className="flex gap-2">
              <SubmitButton label="Criar" />
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
