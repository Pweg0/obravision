"use client"

import Link from "next/link"
import { useState } from "react"
import { StatusBadge } from "./StatusBadge"
import { archiveObra } from "@/lib/actions/obra"

interface Obra {
  id: string
  nome: string
  tipo: string
  area: unknown
  cidade: string
  estado: string
  status: { name: string; color: string } | null
  createdAt: Date
  updatedAt: Date
}

interface ObraTableProps {
  obras: Obra[]
}

const TIPO_LABELS: Record<string, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  REFORMA: "Reforma",
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function ObraTable({ obras }: ObraTableProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null)

  async function handleArchive(id: string) {
    setArchivingId(id)
    await archiveObra(id)
    setArchivingId(null)
  }

  if (obras.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma obra encontrada.
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Area (m²)</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criada em</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {obras.map((obra) => {
            const areaNum = parseFloat(String(obra.area))
            return (
              <tr key={obra.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/obras/${obra.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {obra.nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">{obra.cidade}, {obra.estado}</p>
                </td>
                <td className="px-4 py-3">
                  {obra.status ? (
                    <StatusBadge name={obra.status.name} color={obra.status.color} />
                  ) : (
                    <span className="text-muted-foreground text-xs">Sem status</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {TIPO_LABELS[obra.tipo] ?? obra.tipo}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {areaNum.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(obra.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/obras/${obra.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleArchive(obra.id)}
                      disabled={archivingId === obra.id}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {archivingId === obra.id ? "Arquivando..." : "Arquivar"}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
