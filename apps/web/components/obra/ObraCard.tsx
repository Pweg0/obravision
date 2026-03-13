import Link from "next/link"
import { StatusBadge } from "./StatusBadge"

interface ObraCardProps {
  obra: {
    id: string
    nome: string
    tipo: string
    area: unknown
    cidade: string
    estado: string
    status: { name: string; color: string } | null
    updatedAt: Date
  }
}

const TIPO_LABELS: Record<string, string> = {
  RESIDENCIAL: "Residencial",
  COMERCIAL: "Comercial",
  REFORMA: "Reforma",
}

export function ObraCard({ obra }: ObraCardProps) {
  const areaNum = typeof obra.area === "object"
    ? parseFloat(String(obra.area))
    : Number(obra.area)

  return (
    <Link href={`/dashboard/obras/${obra.id}`} className="block group">
      <div className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Cover image placeholder */}
        <div className="h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <svg className="w-12 h-12 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {obra.nome}
            </h3>
            {obra.status && (
              <StatusBadge name={obra.status.name} color={obra.status.color} />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{TIPO_LABELS[obra.tipo] ?? obra.tipo}</span>
            <span>•</span>
            <span>{areaNum.toLocaleString("pt-BR")} m²</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {obra.cidade}, {obra.estado}
          </p>
          {/* Progress bar placeholder — real data in Phase 2 */}
          <div className="pt-1">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-0 bg-primary rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">0% concluido</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
