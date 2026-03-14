import { Building2, Pencil, UserPlus, FileText } from "lucide-react"

interface ActivityItem {
  id: string
  type: "obra_created" | "obra_updated" | "member_joined"
  title: string
  subtitle: string
  time: Date
}

interface ActivityWidgetProps {
  items: ActivityItem[]
}

const TYPE_CONFIG: Record<string, { icon: typeof Building2; color: string }> = {
  obra_created: { icon: Building2, color: "text-emerald-500 bg-emerald-500/10" },
  obra_updated: { icon: Pencil, color: "text-blue-500 bg-blue-500/10" },
  member_joined: { icon: UserPlus, color: "text-violet-500 bg-violet-500/10" },
}

const DEFAULT_CONFIG = { icon: FileText, color: "text-muted-foreground bg-muted" }

function formatRelativeDate(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes || 1}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date))
}

export function ActivityWidget({ items }: ActivityWidgetProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Atividade recente</h3>
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
        </div>
      ) : (
        <ul>
          {items.map((item, i) => {
            const config = TYPE_CONFIG[item.type] ?? DEFAULT_CONFIG
            const Icon = config.icon
            return (
              <li
                key={item.id}
                className={`flex items-start gap-3 px-5 py-3 ${i < items.length - 1 ? "border-b border-border/50" : ""}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5 tabular-nums">
                  {formatRelativeDate(item.time)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
