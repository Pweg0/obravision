"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pin, MessageSquare, FileText, AtSign, CheckCheck } from "lucide-react"
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationItem,
} from "@/lib/actions/notification"
import { cn } from "@/lib/utils"

interface NotificationDropdownProps {
  onClose: () => void
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "new_pin":
    case "new-pin":
      return <Pin className="w-4 h-4 text-primary flex-shrink-0" />
    case "new_reply":
    case "new-reply":
      return <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
    case "new_revision":
    case "new-revision":
      return <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
    case "mention":
      return <AtSign className="w-4 h-4 text-purple-500 flex-shrink-0" />
    default:
      return <Pin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
  }
}

function getNotificationText(notification: NotificationItem): string {
  const { type, payload } = notification
  const author = payload.authorName ?? "Alguem"
  const planta = payload.plantaName ?? "uma planta"
  const obra = payload.obraName ?? "uma obra"

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
      return `Nova notificacao de ${obra}`
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
  return "/dashboard/notificacoes"
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `${diffMin}m`
  if (diffHrs < 24) return `${diffHrs}h`
  return `${diffDays}d`
}

/**
 * NotificationDropdown — shows 5 most recent notifications.
 *
 * Features:
 * - Type icons: pin (new_pin), reply (new_reply), document (new_revision), @sign (mention)
 * - Relative timestamps
 * - Unread indicator (blue dot)
 * - Click to mark as read + navigate to obra/planta
 * - "Marcar todas como lidas" link at top
 * - "Ver todas" link at bottom
 */
export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadNotifications = useCallback(async () => {
    try {
      const items = await listNotifications({ limit: 5 })
      setNotifications(items)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

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
    onClose()
    router.push(getNotificationHref(notification))
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-2xl shadow-premium-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Notificacoes</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <CheckCheck className="w-3 h-3" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma notificacao
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleClickNotification(notification)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0",
                !notification.readAt && "bg-primary/5"
              )}
            >
              {/* Type icon */}
              <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm leading-snug",
                    !notification.readAt ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {getNotificationText(notification)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.readAt && (
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <Link
          href="/dashboard/notificacoes"
          onClick={onClose}
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Ver todas as notificacoes
        </Link>
      </div>
    </div>
  )
}
