"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { enqueueProposta, getPropostaPdfUrl } from "@/lib/actions/orcamento-pdf"

interface PropostaExportProps {
  orcamentoId: string
  obraId: string
  /** R2 key if PDF was already generated. If set, shows download immediately. */
  existingPdfR2Key?: string | null
}

export function PropostaExport({ orcamentoId, obraId, existingPdfR2Key }: PropostaExportProps) {
  const [status, setStatus] = useState<"idle" | "queuing" | "queued" | "ready" | "error">(
    existingPdfR2Key ? "ready" : "idle"
  )
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch download URL if PDF exists
  const fetchDownloadUrl = useCallback(async () => {
    const url = await getPropostaPdfUrl(orcamentoId)
    if (url) {
      setDownloadUrl(url)
      setStatus("ready")
    }
  }, [orcamentoId])

  useEffect(() => {
    if (existingPdfR2Key) {
      fetchDownloadUrl()
    }
  }, [existingPdfR2Key, fetchDownloadUrl])

  // Listen for pdf-ready socket event
  useEffect(() => {
    // Attempt to connect to the API Socket.io server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

    let cleanup = () => {}

    // Dynamic import to avoid SSR issues
    import("socket.io-client").then(({ io }) => {
      const socket = io(apiUrl, { transports: ["websocket"] })

      socket.emit("join-obra", obraId)

      const handlePdfReady = (data: { type: string; entityId: string; r2Key: string }) => {
        if (data.type === "proposta" && data.entityId === orcamentoId) {
          fetchDownloadUrl()
        }
      }

      socket.on("pdf-ready", handlePdfReady)

      cleanup = () => {
        socket.off("pdf-ready", handlePdfReady)
        socket.disconnect()
      }
    }).catch(() => {
      // Socket.io not available — polling fallback
    })

    return () => cleanup()
  }, [obraId, orcamentoId, fetchDownloadUrl])

  // Poll for PDF readiness if status is "queued"
  useEffect(() => {
    if (status !== "queued") return

    const interval = setInterval(async () => {
      const url = await getPropostaPdfUrl(orcamentoId)
      if (url) {
        setDownloadUrl(url)
        setStatus("ready")
        clearInterval(interval)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [status, orcamentoId])

  async function handleEnqueue() {
    setStatus("queuing")
    setErrorMsg(null)
    setDownloadUrl(null)

    const result = await enqueueProposta(orcamentoId)

    if ("error" in result) {
      setErrorMsg(result.error ?? "Erro desconhecido")
      setStatus("error")
    } else {
      setStatus("queued")
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {status === "idle" && (
        <Button onClick={handleEnqueue} variant="outline" size="sm">
          Exportar Proposta Comercial
        </Button>
      )}

      {status === "queuing" && (
        <Button disabled variant="outline" size="sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Enviando...
          </span>
        </Button>
      )}

      {status === "queued" && (
        <Button disabled variant="outline" size="sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Gerando PDF...
          </span>
        </Button>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-2">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Baixar PDF
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={fetchDownloadUrl}>
              Baixar PDF
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnqueue}
            className="text-xs text-muted-foreground"
          >
            Regenerar
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive">{errorMsg ?? "Erro ao gerar PDF"}</p>
          <Button variant="outline" size="sm" onClick={handleEnqueue}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  )
}
