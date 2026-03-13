"use client"

import { useRef, useTransition } from "react"
import { createPin } from "@/lib/actions/pin"

interface TempPin {
  x: number
  y: number
  pageNumber: number
}

interface PinPopupProps {
  tempPin: TempPin
  plantaRevisaoId: string
  onCancel: () => void
  onCreated: () => void
}

/**
 * Small popup for creating a new pin with an initial comment.
 * Appears near the tempPin position.
 */
export function PinPopup({ tempPin, plantaRevisaoId, onCancel, onCreated }: PinPopupProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const content = textareaRef.current?.value?.trim() ?? ""
    if (!content) return

    startTransition(async () => {
      const result = await createPin(plantaRevisaoId, {
        x: tempPin.x,
        y: tempPin.y,
        pageNumber: tempPin.pageNumber,
        content,
      })

      if (result.success) {
        onCreated()
      } else {
        // Keep popup open on error
        console.error("[PinPopup] createPin error:", result.error)
      }
    })
  }

  return (
    <div
      className="absolute z-40 w-64 rounded-lg border border-gray-200 bg-white shadow-xl"
      style={{
        left: `calc(${tempPin.x * 100}% + 16px)`,
        top: `calc(${tempPin.y * 100}% - 40px)`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3">
        <p className="mb-2 text-sm font-medium text-gray-700">Adicionar comentario aqui?</p>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded border border-gray-300 p-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Escreva seu comentario..."
            rows={3}
            maxLength={2000}
            autoFocus
            disabled={isPending}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
