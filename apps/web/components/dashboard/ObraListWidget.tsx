import Link from "next/link"
import { StatusBadge } from "@/components/obra/StatusBadge"
import { ChevronRight } from "lucide-react"

interface Obra {
  id: string
  nome: string
  tipo: string
  updatedAt: Date
  status: { name: string; color: string } | null
}

interface ObraListWidgetProps {
  obras: Obra[]
}

function formatRelativeDate(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Hoje"
  if (days === 1) return "Ontem"
  if (days < 7) return `${days} dias atras`
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date))
}

export function ObraListWidget({ obras }: ObraListWidgetProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Obras recentes</h3>
        <Link href="/dashboard/obras" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer">
          Ver todas
        </Link>
      </div>
      {obras.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma obra ainda.</p>
          <Link href="/dashboard/obras" className="text-sm text-primary hover:text-primary/80 font-medium mt-2 inline-block cursor-pointer">
            Criar primeira obra
          </Link>
        </div>
      ) : (
        <ul>
          {obras.slice(0, 5).map((obra, i) => (
            <li key={obra.id} className={i < obras.length - 1 ? "border-b border-border/50" : ""}>
              <Link
                href={`/dashboard/obras/${obra.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors duration-200 group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{obra.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeDate(obra.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {obra.status && (
                    <StatusBadge name={obra.status.name} color={obra.status.color} />
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
