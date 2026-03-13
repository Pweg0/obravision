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

const TYPE_ICONS: Record<string, string> = {
  obra_created: "🏗️",
  obra_updated: "✏️",
  member_joined: "👤",
}

function formatRelativeDate(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes || 1}m atras`
  if (hours < 24) return `${hours}h atras`
  if (days < 7) return `${days}d atras`
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date))
}

export function ActivityWidget({ items }: ActivityWidgetProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Atividade recente</h3>
      </div>
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="text-base mt-0.5 flex-shrink-0">
                {TYPE_ICONS[item.type] ?? "📋"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                {formatRelativeDate(item.time)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
