---
phase: 02-pdf-viewer-anchored-comments
verified: 2026-03-13T23:00:00Z
status: human_needed
score: 15/15 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 13/15
  gaps_closed:
    - "createPin now calls emitNotification with event='new-pin' to all obra members except author, wrapped in non-fatal try/catch"
    - "@mention in a comment now triggers directed emitNotification with event='mention' for each mentioned userId, with deduplication preventing double notifications"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Upload a PDF smaller than 5MB and verify it renders in react-pdf viewer"
    expected: "PDF pages visible with zoom controls and page navigation working"
    why_human: "Requires real R2 bucket, browser rendering of canvas, and live Next.js server"
  - test: "Upload a PDF larger than 5MB, wait for BullMQ worker to complete, then open the planta"
    expected: "TileViewer renders WebP tiles instead of react-pdf Document"
    why_human: "Requires Redis, BullMQ worker running in API, and R2 bucket with CORS configured"
  - test: "Click on the plant as an ENGENHEIRO, write a comment, and click Salvar"
    expected: "Pin appears on the plant at the clicked coordinates. Opening the pin shows ThreadSidebar with the message."
    why_human: "Requires live browser, database, and full stack running"
  - test: "Open the plant as a CLIENTE and click on it"
    expected: "No popup appears. No crosshair cursor. Cannot create a pin."
    why_human: "Role-based behavior requires authenticated session with CLIENTE role"
  - test: "Open NotificationBell after a teammate creates a pin — without page refresh"
    expected: "Bell badge shows 1. Toast notification appears. No page refresh required."
    why_human: "Requires two authenticated sessions in different browsers and WebSocket connectivity"
---

# Phase 2: PDF Viewer + Anchored Comments Verification Report

**Phase Goal:** Engineers and clients can look at the same plant, place pins at exact coordinates, discuss in threads, and get notified in real time — with plant revisions tracked by version number
**Verified:** 2026-03-13T23:00:00Z
**Status:** HUMAN NEEDED (all automated checks passed)
**Re-verification:** Yes — after gap closure plan 02-04

---

## Re-verification Summary

Previous verification (2026-03-13T22:30:00Z) found 2 gaps:

1. `createPin` did not call `emitNotification` — no socket event or DB Notification record on pin creation.
2. `addMessage` did not call `emitNotification` — no socket event or DB Notification record on thread replies or @mentions.

Both gaps are now closed. See Gap Closure Evidence below.

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | User can upload a PDF file stored in R2 with a valid key | VERIFIED | `getPresignedUploadUrl` in planta.ts generates `getSignedUrl(PutObjectCommand)` with key `plantas/{tenantId}/{timestamp}-{filename}` |
| 2  | Upload of a new revision requires a changelog and increments revision number (R0, R1, R2) | VERIFIED | `createRevisao` counts existing revisions, formats `R${existingCount}`, Zod validates changelog required |
| 3  | Large PDFs (>5MB) are queued for server-side conversion to WebP tiles via BullMQ | VERIFIED | `createRevisao` calls `fetch(...enqueue-conversion)` when fileSize > 5MB; worker downloads, renders with PDFium at scale=2, converts with sharp, marks `tilesReady=true` |
| 4  | Plants are grouped by disciplina/tipo on the obra page | VERIFIED | `listPlantasByObra` returns `Record<string, PlantaWithRevisoes[]>` grouped by disciplina; `PlantaListByDisciplina.tsx` exists |
| 5  | Older revisions remain accessible when a new revision is uploaded | VERIFIED | `listPlantasByObra` returns all non-deleted revisoes per planta; `RevisionDropdown.tsx` lists all revisions with "atual" badge |
| 6  | Admin can soft-delete a plant or specific revision | VERIFIED | `deletePlanta` and `deleteRevisao` set `deletedAt`; both check `role !== "ADMIN"` |
| 7  | User can view a plant PDF in an embedded viewer with zoom and page navigation | VERIFIED | `PlantaViewerClient.tsx` (254 lines): react-pdf `Document+Page` with scale state (0.5–2.0), page navigation; `ViewerToolbar.tsx` with zoom steps |
| 8  | Viewer renders WebP tiles for large files and react-pdf canvas for small files | VERIFIED | `currentRevisao.tilesReady && currentRevisao.tilesPrefix` gate in PlantaViewerClient renders `TileViewer` or `Document` |
| 9  | User can click any point on the plant to place a pin and write a comment | VERIFIED | `handleViewerClick` → `clickToNormalized` → `setTempPin` → `PinPopup` → `createPin` transaction (Pin + Thread + ThreadMessage) |
| 10 | Pin coordinates survive zoom and browser resize (percentage positioning) | VERIFIED | PinLayer uses `left: ${pin.x * 100}%`, `top: ${pin.y * 100}%` — pure CSS, zero JS recalculation |
| 11 | Threads appear in a right sidebar when a pin is selected | VERIFIED | `ThreadSidebar.tsx` (305 lines): 320px panel with slideInRight animation; loads via `getThread(pinId)`, shows messages with avatars, soft-deleted shown as "Mensagem removida" |
| 12 | User can navigate between revisions via toolbar dropdown | VERIFIED | `RevisionDropdown.tsx` in toolbar triggers `handleRevisaoChange` which calls `listPinsByRevisao` and resets state |
| 13 | Admin+Engenheiro can create pins and comment, Cliente is read-only | VERIFIED | `canCreatePins = userRole === "ADMIN" \|\| "ENGENHEIRO"` gates click handler; `ThreadSidebar` shows "Somente leitura" for non-writers |
| 14 | User receives a toast notification without page refresh when a teammate creates a pin or replies to a thread | VERIFIED | `createPin` imports and calls `emitNotification` at line 9/100 of pin.ts; `addMessage` imports and calls `emitNotification` at line 9/119 of thread.ts; both wrapped in non-fatal try/catch |
| 15 | @mention in a comment triggers directed notification to the mentioned user | VERIFIED | `addMessage` parses mentions via `parseMentions()`, filters self-mentions, then calls `emitNotification` with event="mention" for each mentioned userId (thread.ts lines 139–158); deduplication ensures mentioned users are excluded from the "new-reply" batch |

**Score: 15/15 truths verified**

---

### Gap Closure Evidence

#### Gap 1 — createPin notification wiring

**File:** `apps/web/lib/actions/pin.ts`

- Line 9: `import { emitNotification, getObraMemberIds } from "./notification"`
- Line 98: `const recipientIds = await getObraMemberIds(revisao.planta.obraId, session.user.id)`
- Lines 100–114: `await emitNotification(revisao.planta.obraId, "new-pin", {...}, recipientIds, "new_pin", {...})`
- Lines 116–119: Non-fatal try/catch — `console.error("[createPin] Failed to emit notification:", err)`
- Payload includes: `obraId`, `plantaId`, `plantaName`, `pinId`, `authorName`, `authorId`

#### Gap 2 — addMessage notification wiring (replies and @mentions)

**File:** `apps/web/lib/actions/thread.ts`

- Line 9: `import { emitNotification } from "./notification"`
- Lines 105–106: Self-mention filter — `mentions.filter((id) => id !== session.user.id)`
- Lines 109–136: Block 1 — queries distinct participant authorIds, excludes author and @mentioned users, emits `"new-reply"` event to remaining participants
- Lines 139–158: Block 2 — loops over `mentionedUserIds`, calls `emitNotification` with event=`"mention"`, directed at each mentioned user individually
- Lines 159–161: Single non-fatal try/catch wrapping both blocks
- Deduplication confirmed: `participantIds` filtered by `.filter((id) => id !== session.user.id && !mentionedUserIds.includes(id))` at line 116

#### TODO cleanup confirmed

`apps/web/lib/actions/planta.ts` — grep for TODO/FIXME/PLACEHOLDER returns no matches. The deferred TODO comment documented in the original verification (line 262) has been removed.

---

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `packages/db/prisma/schema.prisma` | VERIFIED | All 6 models present: Planta, PlantaRevisao, Pin, Thread, ThreadMessage, Notification |
| `apps/web/lib/actions/planta.ts` | VERIFIED | Exports: getPresignedUploadUrl, createPlanta, createRevisao, deletePlanta, deleteRevisao, listPlantasByObra. No TODO/stub patterns found. |
| `apps/api/src/queues/pdf-conversion.worker.ts` | VERIFIED | PDFium render at scale=2, sharp WebP conversion, tilesReady=true update confirmed |
| `apps/web/tests/lib/coordinates.test.ts` | VERIFIED | Edge case tests for clickToNormalized and normalizedToPixels |
| `apps/web/lib/utils/coordinates.ts` | VERIFIED | Exports clickToNormalized and normalizedToPixels as pure functions |

#### Plan 02 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `PlantaViewerClient.tsx` | VERIFIED | 254 lines — full state machine with tilesReady gate, click handler, pin selection |
| `PinLayer.tsx` | VERIFIED | 145 lines — CSS percentage pins, author avatar/initial, tempPin pulse, selected ring |
| `ThreadSidebar.tsx` | VERIFIED | 305 lines — messages with avatars, relative timestamps, @mention highlighting, soft-delete, CLIENTE read-only |
| `apps/web/lib/actions/pin.ts` | VERIFIED | 256 lines — createPin (with emitNotification), deletePin, listPinsByRevisao all substantive |
| `apps/web/lib/actions/thread.ts` | VERIFIED | 280 lines — addMessage (with emitNotification + mention loop), deleteMessage, getThread all substantive |

#### Plan 03 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `apps/api/src/plugins/socketio.ts` | VERIFIED | SocketIOServer attached via onReady hook, fp() decoration, join-obra/leave-obra room handlers |
| `apps/web/providers/SocketProvider.tsx` | VERIFIED | Dynamic import in useEffect (SSR-safe), connects to NEXT_PUBLIC_API_URL, join/leave on mount/unmount |
| `apps/web/components/notifications/NotificationBell.tsx` | VERIFIED | Bell icon with badge (9+ cap), socket.on for 4 event types, dropdown toggle |
| `apps/web/lib/actions/notification.ts` | VERIFIED | listNotifications, markAsRead, markAllAsRead, getUnreadCount, emitNotification (6-param signature confirmed), getObraMemberIds — all substantive |
| `apps/api/tests/socket/obra-room.test.ts` | VERIFIED | 5 socket room isolation tests |

#### Plan 04 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `apps/web/lib/actions/pin.ts` | VERIFIED | emitNotification import at line 9; getObraMemberIds call at line 98; new-pin emission at lines 100–114; non-fatal catch at line 116 |
| `apps/web/lib/actions/thread.ts` | VERIFIED | emitNotification import at line 9; new-reply emission at lines 119–136; mention loop at lines 139–158; deduplication at line 116; non-fatal catch at line 159 |

---

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/web/lib/actions/planta.ts` | R2 via @aws-sdk/client-s3 | presigned PUT URL generation | WIRED | `getSignedUrl(r2, new PutObjectCommand(...))` confirmed |
| `apps/web/lib/actions/planta.ts` | `apps/api/src/queues/pdf-conversion.queue.ts` | HTTP call to enqueue BullMQ job | WIRED | `fetch(${apiUrl}/api/plantas/enqueue-conversion, ...)` confirmed |
| `apps/api/src/queues/pdf-conversion.worker.ts` | `packages/db/prisma` | marks tilesReady=true | WIRED | `prisma.plantaRevisao.update({ data: { tilesReady: true, tilesPrefix, pageCount } })` confirmed |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PinLayer.tsx` | `apps/web/lib/utils/coordinates.ts` | CSS percentage vs. normalizedToPixels | PARTIAL (by design) | PinLayer uses inline CSS percentages. `PlantaViewerClient.tsx` imports `clickToNormalized` from coordinates.ts. Design decision: CSS percentage approach requires zero JS recalculation on zoom/resize. |
| `PlantaViewerClient.tsx` | `PinLayer.tsx` | renders PinLayer as absolute overlay | WIRED | `<PinLayer .../>` used in both tile and react-pdf branches |
| `ThreadSidebar.tsx` | `apps/web/lib/actions/thread.ts` | calls addMessage on form submit | WIRED | `import { getThread, addMessage, deleteMessage }` at line 5; `await addMessage(thread.id, formData)` at line 130 |
| `PlantaViewerClient.tsx` | react-pdf Document/Page | conditional rendering based on tilesReady | WIRED | `currentRevisao.tilesReady && currentRevisao.tilesPrefix` gate confirmed |

#### Plan 03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/api/src/plugins/socketio.ts` | `apps/api/src/app.ts` | Socket.io attached after fastify.ready() | WIRED | `fastify.register(socketioPlugin)` at line 19 of app.ts |
| `apps/web/providers/SocketProvider.tsx` | `apps/api/src/plugins/socketio.ts` | socket.io-client connects to NEXT_PUBLIC_API_URL | WIRED | Dynamic `import("socket.io-client")` → `io(apiUrl, ...)` |
| `NotificationBell.tsx` | SocketProvider | useSocket hook listens for notification events | WIRED | `const { socket } = useSocket()` at line 21; `socket.on(event, handleNotification)` for 4 events |

#### Plan 04 Key Links (Gap Closure)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/web/lib/actions/pin.ts` | `apps/web/lib/actions/notification.ts` | `import { emitNotification, getObraMemberIds }` | WIRED | Import confirmed at line 9; `emitNotification(obraId, "new-pin", ...)` confirmed at line 100 |
| `apps/web/lib/actions/thread.ts` | `apps/web/lib/actions/notification.ts` | `import { emitNotification }` — new-reply event | WIRED | Import confirmed at line 9; `emitNotification(obraId, "new-reply", ...)` at line 119 |
| `apps/web/lib/actions/thread.ts` | `apps/web/lib/actions/notification.ts` | `emitNotification` — mention event per userId | WIRED | `emitNotification(obraId, "mention", ..., [userId], ...)` at lines 140–157 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PLNT-01 | 02-01 | User can upload plantas in PDF format | SATISFIED | R2 presigned upload, createPlanta, createRevisao all wired end-to-end |
| PLNT-02 | 02-02 | User can view plantas in PDF viewer with zoom and navigation | SATISFIED | PlantaViewerClient with react-pdf + TileViewer hybrid, ViewerToolbar confirmed |
| PLNT-03 | 02-01 | User can create new plant revisions (R0, R1, R2...) with changelog | SATISFIED | createRevisao validates changelog required, auto-increments revision label |
| PLNT-04 | 02-02, 02-04 | User can click on any point to create an anchored comment with pin and thread | SATISFIED | clickToNormalized → tempPin → PinPopup → createPin transaction (Pin+Thread+ThreadMessage atomically) |
| PLNT-05 | 02-03, 02-04 | User receives real-time notifications when new comments are added via WebSocket | SATISFIED | createPin emits "new-pin"; addMessage emits "new-reply" + "mention"; socket infrastructure (socketio.ts, SocketProvider, NotificationBell) confirmed wired end-to-end |

All 5 phase requirements are satisfied. No orphaned requirements.

---

### Anti-Patterns Found

No blockers. No stubs. No TODO/FIXME/PLACEHOLDER patterns in any of the 3 modified files (pin.ts, thread.ts, planta.ts). The previously-documented TODO in planta.ts line 262 has been removed.

The `return null` instances in `thread.ts` lines 237, 244, and 257 are legitimate early-return guards in the `getThread` read function, not stubs.

---

### Human Verification Required

#### 1. PDF Viewer Rendering

**Test:** Upload a real PDF file to a planta and open the viewer page at `/dashboard/obras/[id]/plantas/[plantaId]`
**Expected:** PDF renders in react-pdf canvas with zoom controls (0.5x–2.0x) and page navigation functional
**Why human:** Requires live R2 bucket, valid CORS, and browser canvas rendering

#### 2. WebP Tile Pipeline End-to-End

**Test:** Upload a PDF larger than 5MB; wait for BullMQ worker to process; reload the planta viewer
**Expected:** TileViewer renders instead of react-pdf; tiles load from `{R2_PUBLIC_URL}/tiles/{id}/page-1.webp`
**Why human:** Requires Redis, BullMQ worker running in `apps/api`, and R2 with correct CORS

#### 3. Pin Creation User Flow

**Test:** As ENGENHEIRO, click anywhere on the plant PDF; type a comment; click Salvar
**Expected:** PinPopup appears at click location; after save, pin circle with author initial appears on plant; clicking pin opens ThreadSidebar
**Why human:** Full-stack user flow — requires authenticated browser session, live DB, and rendered PDF

#### 4. CLIENTE Read-Only Enforcement

**Test:** Log in as a user with role=CLIENTE and open a planta viewer
**Expected:** Cursor is default (not crosshair); clicking the plant does nothing; ThreadSidebar shows "Somente leitura" text instead of message textarea
**Why human:** Role-based behavior requires authenticated CLIENTE session

#### 5. Real-Time Notification Toast

**Test:** Open the plant in two browser windows as different users; create a pin in window A
**Expected:** Window B receives a toast notification without page refresh; bell badge increments
**Why human:** Requires two live sessions and WebSocket connectivity

---

### Phase Summary

All automated verification checks pass at 15/15. The two gaps identified in the initial verification have been fully resolved:

- `createPin` now calls `emitNotification` with event `"new-pin"` to all obra members except the author, using a non-fatal try/catch that ensures notification failures never break pin creation.
- `addMessage` now calls `emitNotification` twice: once with event `"new-reply"` for thread participants (excluding author and @mentioned users), and once with event `"mention"` for each @mentioned user individually. Deduplication is enforced — a user who is both a participant and a @mention recipient receives only the more specific `"mention"` event.

The notification infrastructure (socketio.ts plugin, SocketProvider, NotificationBell, emitNotification, getObraMemberIds) was already confirmed correct in Plan 03. With Plan 04's changes, PLNT-05 is now fully satisfied for all comment actions: pin creation, thread replies, and @mentions.

Five human verification items remain, all requiring a live full-stack environment with R2, Redis, and WebSocket connectivity. These are environmental prerequisites, not code gaps.

---

_Verified: 2026-03-13T23:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after: 02-04-PLAN.md gap closure_
