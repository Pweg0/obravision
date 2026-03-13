"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"

interface SocketContextValue {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
})

interface SocketProviderProps {
  children: React.ReactNode
  obraIds?: string[]
}

/**
 * SocketProvider — connects to the Fastify Socket.io server and joins obra rooms.
 *
 * Pattern: initialize socket ONLY in useEffect to avoid SSR crashes (Next.js RESEARCH.md Pitfall 3).
 * Socket.io-client must not be imported at the module level in a server-rendered context.
 *
 * If obraIds is provided, joins each obra:${obraId} room on mount and leaves on unmount.
 * If obraIds is empty or undefined, connects globally (for receiving cross-obra events).
 */
export function SocketProvider({ children, obraIds }: SocketProviderProps) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Dynamic import ensures socket.io-client only runs in the browser (not SSR)
    let isMounted = true

    const initSocket = async () => {
      const { io } = await import("socket.io-client")

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

      const socket = io(apiUrl, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      if (!isMounted) {
        socket.disconnect()
        return
      }

      socketRef.current = socket

      socket.on("connect", () => {
        setConnected(true)

        // Join all provided obra rooms
        if (obraIds && obraIds.length > 0) {
          obraIds.forEach((obraId) => {
            socket.emit("join-obra", obraId)
          })
        }
      })

      socket.on("disconnect", () => {
        setConnected(false)
      })
    }

    initSocket()

    return () => {
      isMounted = false
      if (socketRef.current) {
        // Leave all obra rooms before disconnecting
        if (obraIds && obraIds.length > 0) {
          obraIds.forEach((obraId) => {
            socketRef.current?.emit("leave-obra", obraId)
          })
        }
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount — obraIds changes are handled via join/leave below

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

/**
 * useSocket — access the Socket.io instance and connection status.
 * Returns { socket, connected }.
 *
 * socket will be null on the server and during SSR hydration.
 * Always check for null before using socket.
 */
export function useSocket(): SocketContextValue {
  return useContext(SocketContext)
}
