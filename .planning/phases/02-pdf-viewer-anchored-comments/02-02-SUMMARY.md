---
phase: 02-pdf-viewer-anchored-comments
plan: "02"
subsystem: pdf-viewer-pins-threads
tags: [react-pdf, pdfjs, pin, thread, comment, viewer, revision, role-based-access]
dependency_graph:
  requires: [02-01]
  provides: [PlantaViewerClient, PinLayer, ThreadSidebar, pin/thread server actions, PlantaViewer tests]
  affects: [02-03-PLAN.md]
tech_stack:
  added:
    - "react-pdf@^9.x (web)"
    - "pdfjs-dist@^4.x (web)"
  patterns:
    - "CSS percentage positioning for pins (left: x*100%, top: y*100%) — zoom/resize invariant"
    - "Hybrid PDF rendering: react-pdf Document/Page for small files, TileViewer WebP for tilesReady=true"
    - "useTransition for server action pending state (no useFormStatus needed outside form)"
    - "stringToColor(authorId) — consistent color derived from user ID for avatar fallback"
    - "scrollIntoView guarded with typeof check for jsdom compatibility"
key_files:
  created:
    - apps/web/lib/validations/pin.ts
    - apps/web/lib/actions/pin.ts
    - apps/web/lib/actions/thread.ts
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/page.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PlantaViewerClient.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/ViewerToolbar.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/RevisionDropdown.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/TileViewer.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PinLayer.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PinPopup.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/ThreadSidebar.tsx
    - apps/web/tests/components/PlantaViewer.test.tsx
  modified: []
decisions:
  - "scrollIntoView guarded with typeof check — jsdom doesn't implement it; guard avoids test breakage without mocking"
  - "useTransition instead of useFormStatus for PinPopup — createPin is called programmatically (not via form action binding)"
  - "PinLayer uses CSS percentage positioning (left: pin.x*100%, top: pin.y*100%) not normalizedToPixels — percentage approach requires zero JS recalculation on zoom/resize"
metrics:
  duration_minutes: 13
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 12
  files_modified: 0
  tests_added: 11
  tests_passing: 30
---

# Phase 2 Plan 2: PDF Viewer with Anchored Comments Summary

**One-liner:** react-pdf/WebP tile hybrid viewer with percentage-positioned pin overlay, Figma-style threaded comment sidebar, role-based read-only enforcement, @mention parsing, revision dropdown, and 30 passing tests.

## What Was Built

### Server Actions

**`apps/web/lib/actions/pin.ts`**

| Action | Permission | Behavior |
|--------|------------|----------|
| `createPin` | Admin + Engenheiro | Creates Pin + Thread + initial ThreadMessage atomically in `prisma.$transaction` |
| `deletePin` | Pin author or Admin | Soft-deletes pin, thread, and all messages in transaction |
| `listPinsByRevisao` | Any authenticated | Returns pins with author info (name/image) and message count |

**`apps/web/lib/actions/thread.ts`**

| Action | Permission | Behavior |
|--------|------------|----------|
| `addMessage` | Admin + Engenheiro | Creates ThreadMessage, parses `@userId` mentions from content |
| `deleteMessage` | Message author or Admin | Soft-delete |
| `getThread` | Any authenticated | Returns thread with all messages (including soft-deleted), author info |

### Zod Validations (`apps/web/lib/validations/pin.ts`)

- `createPinSchema`: x/y (0.0-1.0), pageNumber (positive int), content (1-2000 chars)
- `addMessageSchema`: content (1-2000 chars), mentions (optional string array)

### Viewer Page (`page.tsx` — Server Component)

Fetches planta + revisoes + pins, passes to `PlantaViewerClient` with `userRole`, `userId`, and `r2PublicUrl`.

### PlantaViewerClient

- State machine: `currentRevisaoId`, `pageNumber`, `numPages`, `scale`, `selectedPinId`, `tempPin`
- Rendering gate: `tilesReady && tilesPrefix` → `TileViewer`; else → react-pdf `Document + Page`
- Worker configured via `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()`
- Click handler: CLIENTE role skips entirely; others call `clickToNormalized` → set `tempPin` → show `PinPopup`
- Pin selection: sets `selectedPinId` → `ThreadSidebar` appears on right, viewer shrinks

### PinLayer

- Absolute-positioned `pointer-events: none` container over PDF canvas/tile
- Each pin: `left: ${pin.x * 100}%`, `top: ${pin.y * 100}%` — pure CSS, zero JS on zoom/resize
- Author avatar (img) or initial letter with `stringToColor(authorId)` background
- Pin "tail" arrow: small vertical line + dot below the circle pointing to exact coordinate
- Selected pin: `ring-blue-500 scale-110`
- TempPin: `animate-pulse` with location pin SVG icon

### PinPopup

- Positioned near tempPin using percentage-based offset
- "Adicionar comentario aqui?" header
- Textarea (1-2000 chars, autoFocus), Cancelar / Salvar buttons
- `useTransition` for pending state on Salvar

### ThreadSidebar

- 320px right panel with `slideInRight` CSS animation
- Header: pin author avatar, name, relative timestamp, close X button
- Messages: avatar, name, relative time, content with `@mention` highlighting
- Soft-deleted messages show "Mensagem removida" in italic gray
- Delete menu (kebab "...") on hover, visible to own messages or Admin
- CLIENTE role: textarea replaced with "Somente leitura" text
- Enter key sends message (Shift+Enter for newline)

### ViewerToolbar

Zoom steps: 0.5, 0.75, 1.0, 1.25, 1.5, 2.0. Page navigation with prev/next. RevisionDropdown on right side. Plant name on left.

### RevisionDropdown

Dropdown listing all revisoes with "atual" badge on latest. Clicking a revision reloads pins via `listPinsByRevisao` server action.

### TileViewer

Renders `{R2_PUBLIC_URL}/{tilesPrefix}/page-{pageNumber}.webp` with CSS `transform: scale()` for zoom.

## Test Results

```
30 tests passing across 4 test files:
  tests/lib/coordinates.test.ts        — 10 tests (unchanged, still passing)
  tests/actions/plantas.test.ts        — 4 tests (unchanged, still passing)
  tests/actions/revisoes.test.ts       — 5 tests (unchanged, still passing)
  tests/components/PlantaViewer.test.tsx — 11 tests (new)
    ViewerToolbar: zoom controls, page navigation, plant name display
    PinLayer: percentage positions, onPinSelect callback, selected ring, tempPin pulse
    PlantaViewerClient: CLIENTE cursor=default, planta name render
    PlantaViewerClient: ThreadSidebar hidden initially, opens on pin click
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] scrollIntoView not a function in jsdom**
- **Found during:** Task 2 — first test run for ThreadSidebar
- **Issue:** jsdom (used by Vitest) doesn't implement `Element.scrollIntoView`, causing the ThreadSidebar `useEffect` to throw `TypeError: messagesEndRef.current?.scrollIntoView is not a function`
- **Fix:** Added `typeof messagesEndRef.current.scrollIntoView === "function"` guard before calling
- **Files modified:** `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/ThreadSidebar.tsx`

### Pre-existing Build Issues (Out of Scope)

The following pre-existing build issues were found but NOT modified (out of scope):

- `@obravision/db` package build: `tests/**/*` included in tsconfig but outside `rootDir: src`
- `apps/web` next build: `pages-manifest.json` ENOENT after route generation (Next.js 15 intermittent)
- `apps/web/lib/actions/notification.ts`: Type error `Record<string, unknown>` not assignable to `InputJsonValue`

All issues exist in commits prior to this plan and are tracked in deferred-items.

## Self-Check: PASSED

All 12 files verified on disk:
- `apps/web/lib/validations/pin.ts` FOUND
- `apps/web/lib/actions/pin.ts` FOUND
- `apps/web/lib/actions/thread.ts` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/page.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PlantaViewerClient.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/ViewerToolbar.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/RevisionDropdown.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/TileViewer.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PinLayer.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/PinPopup.tsx` FOUND
- `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/[plantaId]/ThreadSidebar.tsx` FOUND
- `apps/web/tests/components/PlantaViewer.test.tsx` FOUND

Task commits verified: b18c0af (Task 1), 512084f (Task 2)
