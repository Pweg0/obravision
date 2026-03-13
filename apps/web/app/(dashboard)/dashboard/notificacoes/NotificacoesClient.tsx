"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Pin, MessageSquare, FileText, AtSign, CheckCheck, Loader2 } from "lucide-react"
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationItem,
} from "@/lib/actions/notification"
import { cn } from "@/lib/utils"

type FilterTab = "todas" | "nao-lidas"

interface NotificacoesClientProps {
  initialNotifications: NotificationItem[]
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "new_pin":
    case "new-pin":
      return <Pin className="w-5 h-5 text-primary flex-shrink-0" />
    case "new_reply":
    case "new-reply":
      return <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
    case "new_revision":
    case "new-revision":
      return <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
    case "mention":
      return <AtSign className="w-5 h-5 text-purple-500 flex-shrink-0" />
    default:
      return <Pin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
  }
}

function getNotificationText(notification: NotificationItem): string {
  const { type, payload } = notification
  const author = payload.authorName ?? "Alguem"
  const planta = payload.plantaName ?? "uma planta"

  switch (type) {
    case "new_pin":
    case "new-pin":
      return `${author} colocou um pin em ${planta}`
    case "new_reply":
    case "new-reply":
      return `${author} respondeu em ${planta}`
    case "new_revision":
    case "new-revision":
      return `${author} enviou uma nova revisao de ${planta}`
    case "mention":
      return `${author} mencionou voce em ${planta}`
    default:
      return "Nova notificacao"
  }
}

function getNotificationHref(notification: NotificationItem): string {
  const { payload } = notification
  const obraId = payload.obraId
  const plantaId = payload.plantaId

  if (obraId && plantaId) {
    return `/dashboard/obras/${obraId}/plantas/${plantaId}`
  }
  if (obraId) {
    return `/dashboard/obras/${obraId}`
  }
  return "/dashboard"
}

function formatFullTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

const TYPE_LABELS: Record<string, string> = {
  new_pin: "Pin",
  "new-pin": "Pin",
  new_reply: "Resposta",
  "new-reply": "Resposta",
  new_revision: "Nova revisao",
  "new-revision": "Nova revisao",
  mention: "Mencao",
}

/**
 * NotificacoesClient — full notification list with:
 * - Filter tabs: "Todas" / "Nao lidas"
 * - "Marcar todas como lidas" button
 * - Click to mark as read and navigate
 * - "Carregar mais" pagination
 */
export function NotificacoesClient({ initialNotifications }: NotificacoesClientProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [activeTab, setActiveTab] = useState<FilterTab>("todas")
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 20)
  const router = useRouter()

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const lastId = notifications[notifications.length - 1]?.id
      const more = await listNotifications({
        limit: 20,
        cursor: lastId,
        unreadOnly: activeTab === "nao-lidas",
      })

      if (more.length < 20) setHasMore(false)
      setNotifications((prev) => [...prev, ...more])
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = useCallback(async (tab: FilterTab) => {
    setActiveTab(tab)
    setLoading(true)
    setHasMore(true)

    try {
      const items = await listNotifications({
        limit: 20,
        unreadOnly: tab === "nao-lidas",
      })
      setNotifications(items)
      if (items.length < 20) setHasMore(false)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMarkAll = async () => {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })))
  }

  const handleClickNotification = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      await markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date() } : n))
      )
    }
    router.push(getNotificationHref(notification))
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length
  const displayed = activeTab === "nao-lidas"
    ? notifications.filter((n) => !n.readAt)
    : notifications

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notificacoes</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {(["todas", "nao-lidas"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "todas" ? "Todas" : "Nao lidas"}
            {tab === "nao-lidas" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-0 border rounded-lg overflow-hidden bg-card">
        {displayed.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {activeTab === "nao-lidas"
              ? "Nenhuma notificacao nao lida"
              : "Nenhuma notificacao ainda"}
          </div>
        ) : (
          displayed.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClickNotification(notification)}
              className={cn(
                "w-full flex items-start gap-4 px-4 py-4 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0",
                !notification.readAt && "bg-primary/5"
              )}
            >
              {/* Icon */}
              <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      !notification.readAt ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {getNotificationText(notification)}
                  </p>
                  {/* Unread dot */}
                  {!notification.readAt && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatFullTimestamp(notification.createdAt)}
                  </span>
                  <span className="text-xs text-muted-foreground/60">•</span>
                  <span className="text-xs text-muted-foreground/70">
                    {TYPE_LABELS[notification.type] ?? notification.type}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && displayed.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Carregando..." : "Carregar mais"}
          </button>
        </div>
      )}
    </div>
  )
}
