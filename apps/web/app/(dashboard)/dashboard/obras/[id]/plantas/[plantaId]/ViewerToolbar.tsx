"use client"

import { RevisionDropdown } from "./RevisionDropdown"

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

type Revisao = {
  id: string
  revisao: string
  changelog: string
  createdAt: Date
}

interface ViewerToolbarProps {
  plantaNome: string
  scale: number
  onScaleChange: (scale: number) => void
  pageNumber: number
  numPages: number
  onPageChange: (page: number) => void
  revisoes: Revisao[]
  currentRevisaoId: string
  onRevisaoChange: (revisaoId: string) => void
}

export function ViewerToolbar({
  plantaNome,
  scale,
  onScaleChange,
  pageNumber,
  numPages,
  onPageChange,
  revisoes,
  currentRevisaoId,
  onRevisaoChange,
}: ViewerToolbarProps) {
  function zoomOut() {
    const currentIndex = ZOOM_STEPS.findIndex((s) => s >= scale)
    const prevIndex = currentIndex <= 0 ? 0 : currentIndex - 1
    onScaleChange(ZOOM_STEPS[prevIndex])
  }

  function zoomIn() {
    const currentIndex = ZOOM_STEPS.findLastIndex((s) => s <= scale)
    const nextIndex = currentIndex >= ZOOM_STEPS.length - 1 ? ZOOM_STEPS.length - 1 : currentIndex + 1
    onScaleChange(ZOOM_STEPS[nextIndex])
  }

  const canZoomOut = scale > ZOOM_STEPS[0]
  const canZoomIn = scale < ZOOM_STEPS[ZOOM_STEPS.length - 1]

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: plant name */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium text-gray-800">{plantaNome}</span>
      </div>

      {/* Center: zoom + page controls */}
      <div className="flex items-center gap-3">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={!canZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Reduzir zoom"
          >
            −
          </button>
          <span className="w-14 text-center text-sm tabular-nums text-gray-700">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={!canZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-gray-300" />

        {/* Page navigation */}
        {numPages > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterior"
            >
              ‹
            </button>
            <span className="w-28 text-center text-sm tabular-nums text-gray-700">
              Pag. {pageNumber} de {numPages}
            </span>
            <button
              onClick={() => onPageChange(pageNumber + 1)}
              disabled={pageNumber >= numPages}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proxima pagina"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Right: revision dropdown */}
      <div className="flex items-center">
        <RevisionDropdown
          revisoes={revisoes}
          currentRevisaoId={currentRevisaoId}
          onRevisaoChange={onRevisaoChange}
        />
      </div>
    </div>
  )
}
