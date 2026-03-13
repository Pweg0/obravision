import { describe, it, expect } from "vitest"
import { clickToNormalized, normalizedToPixels } from "@/lib/utils/coordinates"

describe("clickToNormalized", () => {
  const makeRect = (left: number, top: number, width: number, height: number): DOMRect => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  })

  it("returns (0.0, 0.0) for click at top-left of container", () => {
    const rect = makeRect(100, 200, 800, 600)
    const result = clickToNormalized(100, 200, rect)
    expect(result).toEqual({ x: 0.0, y: 0.0 })
  })

  it("returns (1.0, 1.0) for click at bottom-right of container", () => {
    const rect = makeRect(100, 200, 800, 600)
    const result = clickToNormalized(900, 800, rect)
    expect(result).toEqual({ x: 1.0, y: 1.0 })
  })

  it("returns (0.5, 0.5) for click at center of container", () => {
    const rect = makeRect(100, 200, 800, 600)
    const result = clickToNormalized(500, 500, rect)
    expect(result).toEqual({ x: 0.5, y: 0.5 })
  })

  it("returns correct fraction for arbitrary click position", () => {
    const rect = makeRect(0, 0, 1000, 500)
    const result = clickToNormalized(250, 100, rect)
    expect(result.x).toBeCloseTo(0.25)
    expect(result.y).toBeCloseTo(0.2)
  })

  it("handles container at page origin (0,0)", () => {
    const rect = makeRect(0, 0, 500, 400)
    const result = clickToNormalized(0, 0, rect)
    expect(result).toEqual({ x: 0.0, y: 0.0 })
  })
})

describe("normalizedToPixels", () => {
  it("returns (500, 400) for center pin in 1000x800 container", () => {
    const result = normalizedToPixels({ x: 0.5, y: 0.5 }, 1000, 800)
    expect(result).toEqual({ left: 500, top: 400 })
  })

  it("returns (0, 0) for top-left pin in any container", () => {
    const result = normalizedToPixels({ x: 0.0, y: 0.0 }, 1200, 900)
    expect(result).toEqual({ left: 0, top: 0 })
  })

  it("returns (containerWidth, containerHeight) for bottom-right pin", () => {
    const result = normalizedToPixels({ x: 1.0, y: 1.0 }, 600, 400)
    expect(result).toEqual({ left: 600, top: 400 })
  })

  it("scales correctly for arbitrary normalized coordinates", () => {
    const result = normalizedToPixels({ x: 0.25, y: 0.75 }, 800, 400)
    expect(result).toEqual({ left: 200, top: 300 })
  })

  it("handles different width and height independently", () => {
    const result = normalizedToPixels({ x: 0.5, y: 0.25 }, 400, 800)
    expect(result).toEqual({ left: 200, top: 200 })
  })
})
