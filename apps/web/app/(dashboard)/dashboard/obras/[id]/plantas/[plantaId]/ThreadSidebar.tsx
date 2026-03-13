"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import type { PinWithAuthor } from "@/lib/actions/pin"
import { getThread, addMessage, deleteMessage, type ThreadWithMessages } from "@/lib/actions/thread"

interface ThreadSidebarProps {
  pinId: string
  pins: PinWithAuthor[]
  userRole: string
  userId: string
  onClose: () => void
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min atras`
  if (hours < 24) return `${hours}h atras`
  return `${days}d atras`
}

/**
 * Renders message content, replacing @userId with highlighted @UserName spans.
 * Since we don't have a user lookup by ID here, we display @userId directly.
 */
function MentionContent({ content }: { content: string }) {
  const parts = content.split(/(@[a-zA-Z0-9_-]+)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-medium text-blue-600">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function AvatarCircle({
  image,
  name,
  size = "sm",
}: {
  image: string | null
  name: string | null
  size?: "sm" | "md"
}) {
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ""}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${dim} ${textSize} flex flex-shrink-0 items-center justify-center rounded-full bg-gray-400 font-semibold text-white`}
    >
      {getInitials(name)}
    </div>
  )
}

export function ThreadSidebar({ pinId, pins, userRole, userId, onClose }: ThreadSidebarProps) {
  const [thread, setThread] = useState<ThreadWithMessages | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const pin = pins.find((p) => p.id === pinId)
  const canWrite = userRole === "ADMIN" || userRole === "ENGENHEIRO"
  const isAdmin = userRole === "ADMIN"

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getThread(pinId).then((t) => {
      if (!cancelled) {
        setThread(t)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [pinId])

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [thread?.messages.length])

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageText.trim() || !thread) return

    const content = messageText.trim()
    setMessageText("")

    startTransition(async () => {
      const formData = new FormData()
      formData.append("content", content)
      const result = await addMessage(thread.id, formData)
      if (result.success) {
        // Reload thread
        const updated = await getThread(pinId)
        setThread(updated)
      }
    })
  }

  function handleDeleteMessage(messageId: string) {
    startTransition(async () => {
      const result = await deleteMessage(messageId)
      if (result.success) {
        const updated = await getThread(pinId)
        setThread(updated)
      }
      setOpenMenuId(null)
    })
  }

  return (
    <div
      className="flex w-80 flex-shrink-0 flex-col border-l border-gray-200 bg-white"
      style={{ animation: "slideInRight 0.2s ease-out" }}
      data-testid="thread-sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {pin && (
            <AvatarCircle image={pin.author.image} name={pin.author.name} size="md" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {pin?.author.name ?? "Usuario"}
            </p>
            {pin && (
              <p className="text-xs text-gray-500">
                {formatRelativeTime(pin.createdAt)}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fechar sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <span className="text-sm text-gray-400">Carregando...</span>
          </div>
        ) : !thread ? (
          <div className="flex h-20 items-center justify-center">
            <span className="text-sm text-gray-400">Thread nao encontrada</span>
          </div>
        ) : (
          <ul className="space-y-4">
            {thread.messages.map((msg) => {
              const isDeleted = msg.deletedAt !== null
              const isOwnMessage = msg.authorId === userId
              const canDelete = isOwnMessage || isAdmin

              return (
                <li key={msg.id} className="group flex items-start gap-2">
                  <AvatarCircle image={msg.author.image} name={msg.author.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-gray-800">
                        {msg.author.name ?? "Usuario"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                      {/* Delete menu */}
                      {!isDeleted && canDelete && (
                        <div className="relative ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === msg.id ? null : msg.id)
                            }
                            className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Opcoes"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </button>
                          {openMenuId === msg.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 z-20 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-md">
                                <button
                                  className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  disabled={isPending}
                                >
                                  Excluir
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {isDeleted ? (
                      <p className="mt-0.5 text-xs italic text-gray-400">Mensagem removida</p>
                    ) : (
                      <p className="mt-0.5 break-words text-sm text-gray-700">
                        <MentionContent content={msg.content} />
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-3">
        {canWrite ? (
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escreva uma mensagem... (@mencao)"
              className="w-full resize-none rounded border border-gray-300 p-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              maxLength={2000}
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e as unknown as React.FormEvent)
                }
              }}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isPending}
              className="self-end rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Enviando..." : "Enviar"}
            </button>
          </form>
        ) : (
          <p className="text-center text-xs text-gray-400">Somente leitura</p>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
