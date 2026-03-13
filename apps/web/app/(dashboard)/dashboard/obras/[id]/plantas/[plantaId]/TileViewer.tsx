"use client"

interface TileViewerProps {
  tilesPrefix: string
  pageNumber: number
  scale: number
  r2PublicUrl: string
  className?: string
}

/**
 * Renders a single WebP tile from R2 for large PDFs where tilesReady=true.
 * Tile URL format: {R2_PUBLIC_URL}/{tilesPrefix}/page-{pageNumber}.webp
 */
export function TileViewer({
  tilesPrefix,
  pageNumber,
  scale,
  r2PublicUrl,
  className,
}: TileViewerProps) {
  const tileUrl = `${r2PublicUrl}/${tilesPrefix}/page-${pageNumber}.webp`

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        transformOrigin: "top left",
        transform: `scale(${scale})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tileUrl}
        alt={`Pagina ${pageNumber}`}
        style={{
          display: "block",
          maxWidth: "100%",
          userSelect: "none",
          pointerEvents: "none",
        }}
        draggable={false}
      />
    </div>
  )
}
