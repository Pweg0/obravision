"use client"

import { useState, useRef } from "react"
import { getRdoPhotoUploadUrl, saveRdoFoto } from "@/lib/actions/rdo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UploadedPhoto {
  r2Key: string
  legenda: string
  preview: string
  ordem: number
  uploading: boolean
  error: string | null
}

interface RdoPhotoUploadProps {
  rdoEntradaId: string
}

export function RdoPhotoUpload({ rdoEntradaId }: RdoPhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const newPhotos: UploadedPhoto[] = files.map((file, i) => ({
      r2Key: "",
      legenda: "",
      preview: URL.createObjectURL(file),
      ordem: photos.length + i,
      uploading: true,
      error: null,
    }))

    const startIndex = photos.length
    setPhotos((prev) => [...prev, ...newPhotos])

    // Upload each file
    await Promise.all(
      files.map(async (file, i) => {
        try {
          // Get presigned URL
          const { url, key } = await getRdoPhotoUploadUrl(
            rdoEntradaId,
            file.name,
            file.type
          )

          // PUT directly to R2
          const uploadResponse = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          })

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`)
          }

          // Save record to DB
          await saveRdoFoto(rdoEntradaId, key, undefined, startIndex + i)

          setPhotos((prev) =>
            prev.map((p, idx) =>
              idx === startIndex + i
                ? { ...p, r2Key: key, uploading: false }
                : p
            )
          )
        } catch {
          setPhotos((prev) =>
            prev.map((p, idx) =>
              idx === startIndex + i
                ? { ...p, uploading: false, error: "Falha no upload. Tente novamente." }
                : p
            )
          )
        }
      })
    )

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleLegendaChange(index: number, legenda: string) {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, legenda } : p))
    )
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    setPhotos((prev) => {
      const updated = [...prev]
      ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
      return updated.map((p, i) => ({ ...p, ordem: i }))
    })
  }

  function handleMoveDown(index: number) {
    setPhotos((prev) => {
      if (index >= prev.length - 1) return prev
      const updated = [...prev]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
      return updated.map((p, i) => ({ ...p, ordem: i }))
    })
  }

  function handleRemove(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, ordem: i })))
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="rdo-photo-input"
        />
        <label htmlFor="rdo-photo-input">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            asChild
          >
            <span>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Fotos
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-1">Aceita JPG, PNG, WEBP</p>
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          {photos.map((photo, index) => (
            <div key={index} className="flex gap-3 rounded-lg border p-3">
              {/* Thumbnail */}
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={`Foto ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-md"
                />
                {photo.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Legenda + actions */}
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Legenda (opcional)"
                  value={photo.legenda}
                  onChange={(e) => handleLegendaChange(index, e.target.value)}
                  disabled={photo.uploading}
                  className="text-sm"
                />
                {photo.error && (
                  <p className="text-xs text-destructive">{photo.error}</p>
                )}
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || photo.uploading}
                    className="h-7 px-2 text-xs"
                  >
                    Cima
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === photos.length - 1 || photo.uploading}
                    className="h-7 px-2 text-xs"
                  >
                    Baixo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    disabled={photo.uploading}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
