"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RdoFoto {
  id: string
  r2Key: string
  legenda: string | null
  ordem: number
}

interface RdoEntradaCardProps {
  entrada: {
    id: string
    data: Date | string
    texto: string | null
    tarefaId: string | null
    climaCondicao: string | null
    climaTemp: number | null
    climaUmidade: number | null
    climaFonteDado: string | null
    maoDeObra: unknown
    materiais: unknown
    ocorrencias: string | null
    fotos: RdoFoto[]
    tarefa?: { nome: string; etapa?: { nome: string } | null } | null
  }
  r2PublicBase?: string
}

export function RdoCard({ entrada, r2PublicBase }: RdoEntradaCardProps) {
  const [showMaoDeObra, setShowMaoDeObra] = useState(false)
  const [showMateriais, setShowMateriais] = useState(false)
  const [showOcorrencias, setShowOcorrencias] = useState(false)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  const dataFormatada = format(new Date(entrada.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const maoDeObraData = entrada.maoDeObra as Record<string, string> | null
  const materiaisData = entrada.materiais as Record<string, string> | null

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b bg-muted/20">
        <div>
          <p className="font-semibold">{dataFormatada}</p>
          {entrada.tarefa && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {entrada.tarefa.etapa ? `${entrada.tarefa.etapa.nome} — ` : ""}
              {entrada.tarefa.nome}
            </p>
          )}
        </div>
        {/* Clima badge */}
        {entrada.climaCondicao && (
          <div className="text-right">
            <p className="text-sm font-medium">{entrada.climaCondicao}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {entrada.climaTemp !== null && (
                <span>{entrada.climaTemp.toFixed(1)}°C</span>
              )}
              {entrada.climaUmidade !== null && (
                <span>{entrada.climaUmidade.toFixed(0)}% UR</span>
              )}
            </div>
            {entrada.climaFonteDado && (
              <p className="text-xs text-muted-foreground">
                Fonte: {entrada.climaFonteDado === "open-meteo" ? "Open-Meteo" : "Manual"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Texto */}
        {entrada.texto && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{entrada.texto}</p>
        )}

        {/* Photos */}
        {entrada.fotos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fotos ({entrada.fotos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[...entrada.fotos].sort((a, b) => a.ordem - b.ordem).map((foto) => {
                const src = r2PublicBase
                  ? `${r2PublicBase}/${foto.r2Key}`
                  : null

                return (
                  <div key={foto.id} className="space-y-1">
                    {src ? (
                      <button
                        type="button"
                        onClick={() => setExpandedPhoto(src)}
                        className="w-full aspect-square overflow-hidden rounded-md border hover:opacity-90 transition-opacity"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={foto.legenda ?? "Foto"}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="w-full aspect-square rounded-md border bg-muted flex items-center justify-center">
                        <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {foto.legenda && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{foto.legenda}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expandable: Mao de Obra */}
        {maoDeObraData && (
          <div>
            <button
              type="button"
              onClick={() => setShowMaoDeObra(!showMaoDeObra)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showMaoDeObra ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Mao de Obra
            </button>
            {showMaoDeObra && (
              <div className="mt-2 pl-5 text-sm text-muted-foreground">
                {maoDeObraData.notas ?? JSON.stringify(maoDeObraData)}
              </div>
            )}
          </div>
        )}

        {/* Expandable: Materiais */}
        {materiaisData && (
          <div>
            <button
              type="button"
              onClick={() => setShowMateriais(!showMateriais)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showMateriais ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Materiais
            </button>
            {showMateriais && (
              <div className="mt-2 pl-5 text-sm text-muted-foreground">
                {materiaisData.notas ?? JSON.stringify(materiaisData)}
              </div>
            )}
          </div>
        )}

        {/* Expandable: Ocorrencias */}
        {entrada.ocorrencias && (
          <div>
            <button
              type="button"
              onClick={() => setShowOcorrencias(!showOcorrencias)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showOcorrencias ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Ocorrencias
            </button>
            {showOcorrencias && (
              <div className="mt-2 pl-5 text-sm text-muted-foreground whitespace-pre-wrap">
                {entrada.ocorrencias}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo expanded lightbox */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
