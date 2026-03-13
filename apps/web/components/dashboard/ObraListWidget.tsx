import Link from "next/link"
import { StatusBadge } from "@/components/obra/StatusBadge"

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
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Obras recentes</h3>
        <Link href="/dashboard/obras" className="text-xs text-primary hover:underline">
          Ver todas
        </Link>
      </div>
      {obras.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma obra ainda.</p>
          <Link href="/dashboard/obras" className="text-sm text-primary hover:underline mt-1 inline-block">
            Criar primeira obra
          </Link>
        </div>
      ) : (
        <ul className="divide-y">
          {obras.slice(0, 5).map((obra) => (
            <li key={obra.id}>
              <Link
                href={`/dashboard/obras/${obra.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{obra.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeDate(obra.updatedAt)}
                  </p>
                </div>
                {obra.status && (
                  <StatusBadge name={obra.status.name} color={obra.status.color} />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
