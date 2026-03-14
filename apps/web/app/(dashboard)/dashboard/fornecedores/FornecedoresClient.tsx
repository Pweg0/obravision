"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { FornecedorForm } from "@/components/compras/FornecedorForm"
import { deleteFornecedor, listFornecedores } from "@/lib/actions/fornecedor"

interface Fornecedor {
  id: string
  nome: string
  cnpj?: string | null
  contato?: string | null
  email?: string | null
  telefone?: string | null
  categorias: string[]
  createdAt?: Date | string
}

interface FornecedoresClientProps {
  initialFornecedores: Fornecedor[]
  currentUserRole: string
}

export function FornecedoresClient({ initialFornecedores, currentUserRole }: FornecedoresClientProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(initialFornecedores)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isRefreshing, startRefreshTransition] = useTransition()

  const canManage = currentUserRole === "ADMIN" || currentUserRole === "ENGENHEIRO"

  function refreshData() {
    startRefreshTransition(async () => {
      const data = await listFornecedores()
      setFornecedores(data as Fornecedor[])
    })
  }

  function handleNewFornecedor(newFornecedor: Fornecedor) {
    setFornecedores((prev) => [...prev, newFornecedor])
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    setDeleteError(null)
    setDeletingId(id)
    const result = await deleteFornecedor(id)
    if ("error" in result) {
      setDeleteError(result.error)
    } else {
      setFornecedores((prev) => prev.filter((f) => f.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            Fornecedores cadastrados para sua empresa — reutilizaveis em todas as obras.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowForm(true)}
            disabled={showForm}
            className="cursor-pointer"
          >
            + Novo Fornecedor
          </Button>
        )}
      </div>

      {/* New Fornecedor Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Novo Fornecedor</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FornecedorForm
              onSuccess={handleNewFornecedor}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      {/* Fornecedores table */}
      {fornecedores.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">Nenhum fornecedor cadastrado ainda.</p>
          {canManage && (
            <Button
              variant="outline"
              className="mt-3 cursor-pointer"
              onClick={() => setShowForm(true)}
            >
              Cadastrar primeiro fornecedor
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b grid grid-cols-5 gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Fornecedor</span>
            <span>Contato</span>
            <span>Categorias</span>
            {canManage && <span className="text-right">Acoes</span>}
          </div>
          <ul className="divide-y">
            {fornecedores.map((f) => (
              <li key={f.id} className="grid grid-cols-5 gap-3 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-2">
                  <p className="font-medium text-sm">{f.nome}</p>
                  {f.cnpj && <p className="text-xs text-muted-foreground">{f.cnpj}</p>}
                  {f.email && <p className="text-xs text-muted-foreground">{f.email}</p>}
                </div>
                <div>
                  {f.contato && <p className="text-sm">{f.contato}</p>}
                  {f.telefone && <p className="text-xs text-muted-foreground">{f.telefone}</p>}
                  {!f.contato && !f.telefone && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {f.categorias.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    f.categorias.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                      >
                        {cat}
                      </span>
                    ))
                  )}
                  {f.categorias.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{f.categorias.length - 3}</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 cursor-pointer h-7 text-xs"
                      onClick={() => handleDelete(f.id)}
                      disabled={deletingId === f.id}
                    >
                      {deletingId === f.id ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
