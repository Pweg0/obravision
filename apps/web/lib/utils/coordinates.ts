/**
 * Coordinate utilities for normalized pin positioning.
 *
 * Pins are stored as normalized (0.0–1.0) coordinates relative to the
 * PDF page container. This makes pin positions DPR-independent, zoom-invariant,
 * and resize-invariant.
 *
 * Origin: top-left corner (CSS coordinate system, NOT PDF PostScript origin).
 * This avoids the Y-axis inversion pitfall (PDF uses bottom-left origin).
 */

/**
 * Converts a mouse click position to normalized coordinates.
 *
 * @param clientX - The clientX property from the mouse event
 * @param clientY - The clientY property from the mouse event
 * @param rect - The bounding client rect of the container element
 * @returns Normalized coordinates { x, y } in range [0.0, 1.0]
 */
export function clickToNormalized(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { x: number; y: number } {
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  }
}

/**
 * Converts normalized pin coordinates to pixel offsets within a container.
 *
 * @param pin - Object with normalized x and y in range [0.0, 1.0]
 * @param containerWidth - Pixel width of the container
 * @param containerHeight - Pixel height of the container
 * @returns Pixel position { left, top } for absolute CSS positioning
 */
export function normalizedToPixels(
  pin: { x: number; y: number },
  containerWidth: number,
  containerHeight: number
): { left: number; top: number } {
  return {
    left: pin.x * containerWidth,
    top: pin.y * containerHeight,
  }
}
