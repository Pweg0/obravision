"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { getUnreadCount } from "@/lib/actions/notification"
import { useSocket } from "@/providers/SocketProvider"
import { NotificationDropdown } from "./NotificationDropdown"

/**
 * NotificationBell — navbar bell icon with unread count badge.
 *
 * - Polls unread count on mount via getUnreadCount server action
 * - Listens to socket events (new-pin, new-reply, new-revision, mention) to increment badge
 * - Toggles NotificationDropdown on click
 * - Badge hidden when count = 0; shows "9+" when count > 9
 */
export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const { socket } = useSocket()

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Non-fatal — silently fail
    }
  }, [])

  // Load unread count on mount
  useEffect(() => {
    loadUnreadCount()
  }, [loadUnreadCount])

  // Listen to socket events and increment badge
  useEffect(() => {
    if (!socket) return

    const NOTIFICATION_EVENTS = ["new-pin", "new-reply", "new-revision", "mention"]

    const handleNotification = () => {
      setUnreadCount((prev) => prev + 1)
    }

    NOTIFICATION_EVENTS.forEach((event) => {
      socket.on(event, handleNotification)
    })

    return () => {
      NOTIFICATION_EVENTS.forEach((event) => {
        socket.off(event, handleNotification)
      })
    }
  }, [socket])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [dropdownOpen])

  const handleDropdownClose = useCallback(() => {
    setDropdownOpen(false)
    // Refresh count after dropdown closes (user may have marked things as read)
    loadUnreadCount()
  }, [loadUnreadCount])

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount)

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        aria-label={`Notificacoes${unreadCount > 0 ? ` (${badgeLabel} nao lidas)` : ""}`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge — only shown when there are unread notifications */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            aria-hidden="true"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <NotificationDropdown onClose={handleDropdownClose} />
      )}
    </div>
  )
}
