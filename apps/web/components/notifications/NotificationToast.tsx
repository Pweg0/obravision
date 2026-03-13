"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useSocket } from "@/providers/SocketProvider"
import type { NotificationPayload } from "@/lib/actions/notification"

interface NotificationEventData extends NotificationPayload {
  notificationId?: string
}

function getNotificationMessage(event: string, data: NotificationEventData): string {
  const author = data.authorName ?? "Alguem"
  const planta = data.plantaName ?? "uma planta"

  switch (event) {
    case "new-pin":
      return `${author} colocou um pin em ${planta}`
    case "new-reply":
      return `${author} respondeu em ${planta}`
    case "new-revision":
      return `${author} enviou uma nova revisao de ${planta}`
    case "mention":
      return `${author} mencionou voce em ${planta}`
    case "tiles-ready":
      return `Conversao de PDF concluida para ${planta}`
    default:
      return "Nova notificacao"
  }
}

function getNotificationHref(data: NotificationEventData): string {
  if (data.obraId && data.plantaId) {
    return `/dashboard/obras/${data.obraId}/plantas/${data.plantaId}`
  }
  if (data.obraId) {
    return `/dashboard/obras/${data.obraId}`
  }
  return "/dashboard/notificacoes"
}

/**
 * Plays a discrete notification sound using the Web Audio API.
 * Generates a simple 440Hz beep at low volume (0.1), 100ms duration.
 * No audio file required — completely generated in-browser.
 */
function playNotificationSound() {
  try {
    // Lazily create AudioContext on first call (browsers require user gesture context)
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(440, ctx.currentTime) // A4 — 440Hz

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime) // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1) // Fade out over 100ms

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  } catch {
    // Non-fatal — sound is optional enhancement
  }
}

/**
 * NotificationToast — listens to socket events and shows toast popups.
 *
 * Rendered at layout level (not per-obra). Listens to all notification events
 * on the connected socket and shows a sonner toast with:
 * - Description text
 * - "Ver" action link
 * - Discrete notification sound (440Hz beep, 100ms, low volume)
 * - Auto-dismiss after 5 seconds
 *
 * This component renders nothing (null) — it's purely a side-effect listener.
 */
export function NotificationToast() {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const NOTIFICATION_EVENTS = ["new-pin", "new-reply", "new-revision", "mention"]

    const handleNotification = (event: string) => (data: NotificationEventData) => {
      const message = getNotificationMessage(event, data)
      const href = getNotificationHref(data)

      playNotificationSound()

      toast(message, {
        duration: 5000,
        action: {
          label: "Ver",
          onClick: () => {
            window.location.href = href
          },
        },
      })
    }

    const handlers = NOTIFICATION_EVENTS.map((event) => {
      const handler = handleNotification(event)
      socket.on(event, handler)
      return { event, handler }
    })

    return () => {
      handlers.forEach(({ event, handler }) => {
        socket.off(event, handler)
      })
    }
  }, [socket])

  // Renders nothing — side-effect only
  return null
}
