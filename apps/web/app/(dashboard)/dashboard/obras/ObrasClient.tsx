"use client"

import { useState, useEffect } from "react"
import { ObraCard } from "@/components/obra/ObraCard"
import { ObraTable } from "@/components/obra/ObraTable"
import { ObraForm } from "@/components/obra/ObraForm"
import { ViewToggle } from "@/components/obra/ViewToggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type ViewMode = "cards" | "table"

interface ObraStatus {
  id: string
  name: string
  color: string
}

interface Obra {
  id: string
  nome: string
  tipo: string
  area: unknown
  cidade: string
  estado: string
  status: ObraStatus | null
  createdAt: Date
  updatedAt: Date
}

interface ObrasClientProps {
  obras: Obra[]
  statuses: ObraStatus[]
}

const VIEW_KEY = "obravision_obras_view"

export function ObrasClient({ obras, statuses }: ObrasClientProps) {
  const [view, setView] = useState<ViewMode>("cards")
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTipo, setFilterTipo] = useState("")

  // Persist view preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null
    if (saved === "cards" || saved === "table") {
      setView(saved)
    }
  }, [])

  function handleViewChange(v: ViewMode) {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  // Client-side filtering on top of server-fetched data
  const filtered = obras.filter((obra) => {
    if (search && !obra.nome.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && obra.status?.id !== filterStatus) return false
    if (filterTipo && obra.tipo !== filterTipo) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Obras</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {obras.length} obra{obras.length !== 1 ? "s" : ""} ativa{obras.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/obras/archived"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Arquivadas
          </Link>
          <Button onClick={() => setShowForm(true)}>
            + Nova Obra
          </Button>
        </div>
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 min-w-0"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Todos os status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Todos os tipos</option>
          <option value="RESIDENCIAL">Residencial</option>
          <option value="COMERCIAL">Comercial</option>
          <option value="REFORMA">Reforma</option>
        </select>
        <ViewToggle value={view} onChange={handleViewChange} />
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nova Obra</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ObraForm onSuccess={() => setShowForm(false)} statuses={statuses} />
          </div>
        </div>
      )}

      {/* Obras listing */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Nenhuma obra encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {obras.length === 0
                ? "Crie sua primeira obra clicando em \"Nova Obra\"."
                : "Tente ajustar os filtros de busca."}
            </p>
          </div>
          {obras.length === 0 && (
            <Button onClick={() => setShowForm(true)}>+ Nova Obra</Button>
          )}
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((obra) => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>
      ) : (
        <ObraTable obras={filtered} />
      )}
    </div>
  )
}
