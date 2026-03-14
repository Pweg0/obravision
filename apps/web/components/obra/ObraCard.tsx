import Link from "next/link"
import { StatusBadge } from "./StatusBadge"
import { Building2, MapPin } from "lucide-react"

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
    <Link href={`/dashboard/obras/${obra.id}`} className="block group cursor-pointer">
      <div className="rounded-2xl border border-border bg-card shadow-premium hover:shadow-premium-lg transition-all duration-300 overflow-hidden">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10 dark:from-primary/25 dark:via-primary/15 dark:to-accent/10 flex items-center justify-center relative">
          <Building2 className="w-10 h-10 text-primary/25" />
          {obra.status && (
            <div className="absolute top-3 right-3">
              <StatusBadge name={obra.status.name} color={obra.status.color} />
            </div>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
            {obra.nome}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium">{TIPO_LABELS[obra.tipo] ?? obra.tipo}</span>
            <span className="text-border">|</span>
            <span>{areaNum.toLocaleString("pt-BR")} m2</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{obra.cidade}, {obra.estado}</span>
          </div>
          {/* Progress bar */}
          <div className="pt-1">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full w-0 bg-primary rounded-full" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">0% concluido</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
