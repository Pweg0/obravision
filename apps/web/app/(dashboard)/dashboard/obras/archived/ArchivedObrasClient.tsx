"use client"

import Link from "next/link"
import { useState } from "react"
import { unarchiveObra } from "@/lib/actions/obra"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/obra/StatusBadge"

interface Obra {
  id: string
  nome: string
  tipo: string
  area: unknown
  cidade: string
  estado: string
  status: { name: string; color: string } | null
  updatedAt: Date
}

interface ArchivedObrasClientProps {
  obras: Obra[]
}

export function ArchivedObrasClient({ obras }: ArchivedObrasClientProps) {
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null)

  async function handleUnarchive(id: string) {
    setUnarchivingId(id)
    await unarchiveObra(id)
    setUnarchivingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/obras"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Obras
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Arquivadas</span>
          </div>
          <h1 className="text-2xl font-bold">Obras Arquivadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {obras.length} obra{obras.length !== 1 ? "s" : ""} arquivada{obras.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b gap-1">
        <Link
          href="/dashboard/obras"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Ativas
        </Link>
        <button
          className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary -mb-px"
          disabled
        >
          Arquivadas
        </button>
      </div>

      {obras.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-medium text-muted-foreground">Nenhuma obra arquivada</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Area</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {obras.map((obra) => {
                const areaNum = parseFloat(String(obra.area))
                return (
                  <tr key={obra.id} className="hover:bg-muted/30 transition-colors opacity-75">
                    <td className="px-4 py-3">
                      <span className="font-medium">{obra.nome}</span>
                      <p className="text-xs text-muted-foreground">{obra.cidade}, {obra.estado}</p>
                    </td>
                    <td className="px-4 py-3">
                      {obra.status ? (
                        <StatusBadge name={obra.status.name} color={obra.status.color} />
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem status</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {obra.tipo.charAt(0) + obra.tipo.slice(1).toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {areaNum.toLocaleString("pt-BR")} m²
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnarchive(obra.id)}
                        disabled={unarchivingId === obra.id}
                      >
                        {unarchivingId === obra.id ? "Desarquivando..." : "Desarquivar"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
