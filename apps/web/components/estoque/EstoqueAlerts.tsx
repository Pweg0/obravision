"use client"

import { useEffect, useState } from "react"

interface AlertItem {
  descricao: string
  saldo: number
  quantidadeMinima: number
  depositoNome?: string
}

interface EstoqueAlertsProps {
  initialAlerts: AlertItem[]
  obraId: string
}

export function EstoqueAlerts({ initialAlerts, obraId }: EstoqueAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts)

  // Listen for real-time "estoque-baixo" socket events
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (!win.__socketConnected) return

    const socket = win.__socket
    if (!socket) return

    // Join obra room if not already
    socket.emit("join-obra", obraId)

    function handleEstoqueBaixo(data: AlertItem) {
      setAlerts((prev) => {
        // Replace existing alert for same material or add new one
        const existing = prev.findIndex((a) => a.descricao === data.descricao)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = data
          return next
        }
        return [...prev, data]
      })
    }

    socket.on("estoque-baixo", handleEstoqueBaixo)
    return () => {
      socket.off("estoque-baixo", handleEstoqueBaixo)
    }
  }, [obraId])

  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-red-700">Alertas de Estoque Baixo</h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.descricao}
            className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-red-800">{alert.descricao}</p>
              {alert.depositoNome && (
                <p className="text-xs text-red-600">{alert.depositoNome}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-red-700">
                Atual: <span className="font-bold">{alert.saldo.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</span>
              </p>
              <p className="text-xs text-red-600">
                Minimo: {alert.quantidadeMinima.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
