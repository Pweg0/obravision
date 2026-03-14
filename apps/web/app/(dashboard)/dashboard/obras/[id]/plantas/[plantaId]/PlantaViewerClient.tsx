"use client"

import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { ViewerToolbar } from "./ViewerToolbar"
import { TileViewer } from "./TileViewer"
import { PinLayer } from "./PinLayer"
import { PinPopup } from "./PinPopup"
import { ThreadSidebar } from "./ThreadSidebar"
import { listPinsByRevisao, type PinWithAuthor } from "@/lib/actions/pin"
import { getPresignedReadUrl } from "@/lib/actions/planta"
import { clickToNormalized } from "@/lib/utils/coordinates"

// Configure react-pdf worker via CDN (local bundling doesn't work reliably with Next.js production builds)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type Revisao = {
  id: string
  revisao: string
  changelog: string
  tilesReady: boolean
  tilesPrefix: string | null
  pageCount: number | null
  r2Key: string
  createdAt: Date
}

interface PlantaViewerClientProps {
  planta: {
    id: string
    nome: string
    disciplina: string
    obraId: string
  }
  revisoes: Revisao[]
  initialPins: PinWithAuthor[]
  currentRevisao: Revisao | null
  userRole: string
  userId: string
  initialPdfUrl: string | null
}

export function PlantaViewerClient({
  planta,
  revisoes,
  initialPins,
  currentRevisao: initialRevisao,
  userRole,
  userId,
  initialPdfUrl,
}: PlantaViewerClientProps) {
  const [currentRevisaoId, setCurrentRevisaoId] = useState(initialRevisao?.id ?? "")
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState(initialRevisao?.pageCount ?? 0)
  const [scale, setScale] = useState(1.0)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [tempPin, setTempPin] = useState<{ x: number; y: number; pageNumber: number } | null>(null)
  const [pins, setPins] = useState<PinWithAuthor[]>(initialPins)
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl)

  const currentRevisao = revisoes.find((r) => r.id === currentRevisaoId) ?? initialRevisao

  const canCreatePins = userRole === "ADMIN" || userRole === "ENGENHEIRO"

  // When revision changes: load new pins + presigned URL, reset page + selection
  async function handleRevisaoChange(revisaoId: string) {
    setCurrentRevisaoId(revisaoId)
    setPageNumber(1)
    setSelectedPinId(null)
    setTempPin(null)
    const newRevisao = revisoes.find((r) => r.id === revisaoId)
    if (newRevisao?.pageCount) {
      setNumPages(newRevisao.pageCount)
    }
    const [newPins, newUrl] = await Promise.all([
      listPinsByRevisao(revisaoId),
      newRevisao ? getPresignedReadUrl(newRevisao.r2Key) : Promise.resolve(null),
    ])
    setPins(newPins)
    setPdfUrl(newUrl)
  }

  function handlePageChange(page: number) {
    if (page < 1 || page > numPages) return
    setPageNumber(page)
    setSelectedPinId(null)
    setTempPin(null)
  }

  function handleViewerClick(e: React.MouseEvent<HTMLDivElement>) {
    // Don't create a pin if read-only or already showing a popup
    if (!canCreatePins) return
    if (tempPin) return

    // Ignore clicks on existing pins — they're handled by PinLayer
    const target = e.target as HTMLElement
    if (target.closest("[data-pin]")) return

    const rect = e.currentTarget.getBoundingClientRect()
    const normalized = clickToNormalized(e.clientX, e.clientY, rect)
    setTempPin({ ...normalized, pageNumber })
    setSelectedPinId(null)
  }

  function handlePinSelect(pinId: string) {
    setSelectedPinId(pinId)
    setTempPin(null)
  }

  const handlePinCreated = useCallback(async () => {
    setTempPin(null)
    if (currentRevisaoId) {
      const newPins = await listPinsByRevisao(currentRevisaoId)
      setPins(newPins)
    }
  }, [currentRevisaoId])

  const sidebarOpen = selectedPinId !== null

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-100">
      {/* Toolbar */}
      <ViewerToolbar
        plantaNome={planta.nome}
        scale={scale}
        onScaleChange={setScale}
        pageNumber={pageNumber}
        numPages={numPages}
        onPageChange={handlePageChange}
        revisoes={revisoes}
        currentRevisaoId={currentRevisaoId}
        onRevisaoChange={handleRevisaoChange}
      />

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Viewer area */}
        <div
          className={`relative flex flex-1 items-start justify-center overflow-auto bg-gray-200 transition-all duration-200 ${
            sidebarOpen ? "mr-0" : ""
          }`}
          onClick={handleViewerClick}
          style={{ cursor: canCreatePins && !tempPin ? "crosshair" : "default" }}
          data-viewer-container
        >
          {!currentRevisao ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              <p>Nenhuma revisao disponivel</p>
            </div>
          ) : currentRevisao.tilesReady && currentRevisao.tilesPrefix ? (
            /* Tile rendering for large files */
            <div
              className="relative"
              style={{ transformOrigin: "top center" }}
            >
              <TileViewer
                tilesPrefix={currentRevisao.tilesPrefix}
                pageNumber={pageNumber}
                scale={scale}
                r2PublicUrl=""
              />
              {/* Pin overlay for tile viewer */}
              <div
                className="absolute inset-0"
                style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
              >
                <PinLayer
                  pins={pins.filter((p) => p.pageNumber === pageNumber)}
                  tempPin={tempPin}
                  selectedPinId={selectedPinId}
                  onPinSelect={handlePinSelect}
                  currentUserId={userId}
                />
              </div>
            </div>
          ) : (
            /* react-pdf rendering for small files */
            <div className="relative py-4">
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages: total }) => {
                  setNumPages(total)
                }}
                onLoadError={(error) => {
                  console.error("[PlantaViewer] PDF load error:", error)
                }}
                loading={
                  <div className="flex h-48 items-center justify-center">
                    <span className="text-sm text-gray-500">Carregando PDF...</span>
                  </div>
                }
                error={
                  <div className="flex h-48 items-center justify-center">
                    <span className="text-sm text-red-500">Erro ao carregar PDF</span>
                  </div>
                }
              >
                <div className="relative">
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  {/* Pin overlay for react-pdf */}
                  <div className="absolute inset-0">
                    <PinLayer
                      pins={pins.filter((p) => p.pageNumber === pageNumber)}
                      tempPin={tempPin}
                      selectedPinId={selectedPinId}
                      onPinSelect={handlePinSelect}
                      currentUserId={userId}
                    />
                  </div>
                </div>
              </Document>

              {/* Pin creation popup */}
              {tempPin && currentRevisao && (
                <PinPopup
                  tempPin={tempPin}
                  plantaRevisaoId={currentRevisao.id}
                  onCancel={() => setTempPin(null)}
                  onCreated={handlePinCreated}
                />
              )}
            </div>
          )}

          {/* Pin creation popup for tile viewer */}
          {tempPin && currentRevisao?.tilesReady && (
            <PinPopup
              tempPin={tempPin}
              plantaRevisaoId={currentRevisao.id}
              onCancel={() => setTempPin(null)}
              onCreated={handlePinCreated}
            />
          )}
        </div>

        {/* Thread sidebar */}
        {sidebarOpen && (
          <ThreadSidebar
            pinId={selectedPinId!}
            pins={pins}
            userRole={userRole}
            userId={userId}
            onClose={() => setSelectedPinId(null)}
          />
        )}
      </div>
    </div>
  )
}
