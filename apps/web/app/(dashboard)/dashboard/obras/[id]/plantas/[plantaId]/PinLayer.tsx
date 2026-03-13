"use client"

import type { PinWithAuthor } from "@/lib/actions/pin"

interface TempPin {
  x: number
  y: number
  pageNumber: number
}

interface PinLayerProps {
  pins: PinWithAuthor[]
  tempPin: TempPin | null
  selectedPinId: string | null
  onPinSelect: (pinId: string) => void
  currentUserId: string
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Absolute-positioned overlay over the PDF canvas or tile container.
 * Pins are placed using CSS percentage coordinates for zoom/resize invariance.
 */
export function PinLayer({
  pins,
  tempPin,
  selectedPinId,
  onPinSelect,
}: PinLayerProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-label="Camada de pins"
    >
      {/* Existing pins */}
      {pins.map((pin) => (
        <button
          key={pin.id}
          data-pin={pin.id}
          className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-full focus:outline-none ${
            selectedPinId === pin.id ? "z-20" : "z-10"
          }`}
          style={{
            left: `${pin.x * 100}%`,
            top: `${pin.y * 100}%`,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onPinSelect(pin.id)
          }}
          aria-label={`Pin de ${pin.author.name ?? "usuario"}`}
          title={`Pin de ${pin.author.name ?? "usuario"}`}
        >
          {/* Pin tail / arrow pointing to exact coordinate */}
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-2 transition-all ${
                selectedPinId === pin.id
                  ? "ring-blue-500 ring-offset-1 scale-110"
                  : "ring-white hover:ring-blue-300 hover:scale-105"
              }`}
              style={{
                backgroundColor: stringToColor(pin.authorId),
              }}
            >
              {pin.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pin.author.image}
                  alt={pin.author.name ?? ""}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span>{getInitials(pin.author.name)}</span>
              )}
            </div>
            {/* Small tail pointing down to coordinate */}
            <div
              className="h-2 w-0.5"
              style={{
                backgroundColor: stringToColor(pin.authorId),
                boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            />
            <div
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: stringToColor(pin.authorId) }}
            />
          </div>
        </button>
      ))}

      {/* Temporary pin (pending creation) */}
      {tempPin && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{
            left: `${tempPin.x * 100}%`,
            top: `${tempPin.y * 100}%`,
          }}
          aria-label="Pin temporario"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-blue-500 text-xs text-white shadow-md ring-2 ring-white ring-offset-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div className="h-2 w-0.5 bg-blue-500" />
            <div className="h-1 w-1 rounded-full bg-blue-500" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Generates a consistent color from a string (user ID).
 * Used as avatar background when no image is available.
 */
function stringToColor(str: string): string {
  const COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
