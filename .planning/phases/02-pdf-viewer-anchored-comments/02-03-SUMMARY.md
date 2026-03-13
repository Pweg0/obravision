---
phase: 02-pdf-viewer-anchored-comments
plan: "03"
subsystem: realtime-notifications
tags: [socket.io, fastify-plugin, sonner, react-context, notification, toast, badge, sse]

dependency_graph:
  requires:
    - phase: 02-01
      provides: "Notification Prisma model, Socket.io on Fastify 5, ObraMember model"
    - phase: 01-01
      provides: "Auth.js session, Empresa.tenantId, RLS tenant isolation"
    - phase: 01-02
      provides: "DashboardLayout, obra membership, user session"
  provides:
    - "Socket.io Fastify plugin (socketio.ts) with fp() decoration and io on fastify instance"
    - "SocketProvider client context with dynamic import (no SSR crash) and join/leave-obra"
    - "Notification server actions: listNotifications, markAsRead, markAllAsRead, getUnreadCount, emitNotification"
    - "POST /api/notifications/emit and /create Fastify routes"
    - "NotificationBell with unread badge (9+ cap) and dropdown toggle"
    - "NotificationDropdown with 5 most recent, type icons, relative timestamps, mark-all-read"
    - "NotificationToast with Web Audio API 440Hz beep, sonner 5s auto-dismiss"
    - "NotificacoesClient with filter tabs, load-more pagination, full timestamp"
    - "/dashboard/notificacoes Server Component page with SSR initial data"
    - "5 socket room isolation tests (all pass)"
  affects:
    - "02-02 (pin/thread actions should call emitNotification — TODO comments added)"
    - "Any future feature adding notifications"

tech_stack:
  added:
    - "socket.io-client@^4.x (web)"
    - "fastify-plugin@^4.x (api)"
    - "socket.io-client@^4.x (api, devDep for tests)"
    - "sonner@latest (web)"
  patterns:
    - "Socket.io attached via Fastify onReady hook with fp() decoration (not fastify-socket.io plugin)"
    - "SocketProvider uses dynamic import() in useEffect to avoid SSR crash (Next.js RESEARCH.md Pitfall 3)"
    - "emitNotification is non-fatal: notification failure never blocks the primary action"
    - "Web Audio API oscillator for discrete notification sound (no audio file required)"
    - "Server Component page + Client Component for SSR initial data + client-side state pattern"

key-files:
  created:
    - apps/api/src/plugins/socketio.ts
    - apps/api/src/routes/notifications.ts
    - apps/api/tests/socket/obra-room.test.ts
    - apps/web/providers/SocketProvider.tsx
    - apps/web/lib/actions/notification.ts
    - apps/web/components/notifications/NotificationBell.tsx
    - apps/web/components/notifications/NotificationDropdown.tsx
    - apps/web/components/notifications/NotificationToast.tsx
    - apps/web/app/(dashboard)/dashboard/notificacoes/page.tsx
    - apps/web/app/(dashboard)/dashboard/notificacoes/NotificacoesClient.tsx
  modified:
    - apps/api/src/app.ts (refactored — register socketio plugin, notificationsRoutes)
    - apps/web/lib/actions/planta.ts (createRevisao now calls emitNotification)
    - apps/web/app/(dashboard)/layout.tsx (SocketProvider + Toaster + NotificationToast)
    - apps/web/components/dashboard/DashboardLayout.tsx (NotificationBell in headers, nav item)

key-decisions:
  - "Socket.io extracted from inline app.ts into dedicated Fastify plugin using fp() so io decoration is available on all route handlers"
  - "SocketProvider uses dynamic import() inside useEffect — only browser-side; avoids SSR crash (RESEARCH.md Pitfall 3)"
  - "emitNotification is non-fatal in createRevisao — socket/notification errors never fail the primary revision creation"
  - "Web Audio API oscillator (440Hz, 100ms, 0.1 volume) for notification sound — no audio file required, works in all modern browsers"
  - "Dashboard layout fetches user's obraIds server-side to pre-join all rooms on socket connect"

patterns-established:
  - "Non-fatal notification pattern: try/catch around emitNotification in server actions, log error but return success"
  - "Notification Server Action pattern: listNotifications/markAsRead/markAllAsRead share getTenantContext helper"
  - "Socket event naming: snake_case for DB types (new_pin), kebab-case for socket events (new-pin)"

requirements-completed: [PLNT-05]

duration: 12min
completed: "2026-03-13"
---

# Phase 2 Plan 3: Socket.io WebSocket Hub and Real-time Notifications Summary

**Socket.io Fastify plugin with room-per-obra isolation, SocketProvider for Next.js, notification server actions with bell/badge/dropdown/toast UI, and /notificacoes history page with 5 passing socket isolation tests.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-13T22:07:58Z
- **Completed:** 2026-03-13T22:19:35Z
- **Tasks:** 2
- **Files created:** 10
- **Files modified:** 4

## Accomplishments

- Socket.io plugin extracted into `plugins/socketio.ts` with fp() decoration so `fastify.io` is available in all route handlers and workers
- SocketProvider uses dynamic import in useEffect (no SSR crash), joins all user's obra rooms on dashboard load
- Full notification stack: server actions (list/markAsRead/markAllAsRead/getUnreadCount/emitNotification), NotificationBell with badge, NotificationDropdown with 5 most recent, NotificationToast with Web Audio API beep, dedicated /notificacoes page
- `createRevisao` wires `emitNotification` — all obra members receive notification when a new revision is uploaded
- 5 socket room isolation tests pass, confirming obra:A events don't leak into obra:B

## Task Commits

1. **Task 1: Socket.io plugin, SocketProvider, notification actions, emit routes** - `42b2eb0` (feat)
2. **Task 2: Notification UI — bell, dropdown, toast, /notificacoes page** - `43826f1` (feat)

## Files Created/Modified

- `apps/api/src/plugins/socketio.ts` — Fastify plugin with fp(), onReady hook, io decoration
- `apps/api/src/routes/notifications.ts` — POST /api/notifications/emit and /create routes
- `apps/api/tests/socket/obra-room.test.ts` — 5 isolation tests (join, receive, isolation, timing, leave)
- `apps/web/providers/SocketProvider.tsx` — Client context with dynamic import, join/leave-obra
- `apps/web/lib/actions/notification.ts` — 5 server actions + emitNotification helper + getObraMemberIds
- `apps/web/components/notifications/NotificationBell.tsx` — Bell icon with badge, dropdown toggle
- `apps/web/components/notifications/NotificationDropdown.tsx` — 5 most-recent with type icons
- `apps/web/components/notifications/NotificationToast.tsx` — sonner toast + Web Audio API beep
- `apps/web/app/(dashboard)/dashboard/notificacoes/page.tsx` — Server Component with SSR data
- `apps/web/app/(dashboard)/dashboard/notificacoes/NotificacoesClient.tsx` — Filter tabs, pagination
- `apps/api/src/app.ts` — Refactored to use socketio plugin and notificationsRoutes
- `apps/web/lib/actions/planta.ts` — createRevisao calls emitNotification for new-revision events
- `apps/web/app/(dashboard)/layout.tsx` — SocketProvider + Toaster + NotificationToast wrappers
- `apps/web/components/dashboard/DashboardLayout.tsx` — NotificationBell in headers + Notificacoes nav

## Decisions Made

- **fp() Fastify plugin**: Using `fastify-plugin` wraps the socketio plugin so `fastify.decorate("io")` is visible on the root scope (not just a child plugin scope).
- **Dynamic import SocketProvider**: `import("socket.io-client")` inside useEffect is the only safe pattern — importing socket.io-client at the module level causes SSR crashes in Next.js App Router.
- **Non-fatal emitNotification**: Notification failures never propagate to break primary operations (revision creation, etc.). Logged with console.error.
- **Web Audio oscillator**: 440Hz sine wave at 0.1 gain, 100ms duration — discrete, no audio file dependency.
- **Server-side obraIds in layout**: Dashboard root layout (Server Component) fetches user's obra memberships so SocketProvider can join all rooms immediately on connect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma JSON payload cast for TypeScript**
- **Found during:** Task 1 — TypeScript check
- **Issue:** `Record<string, unknown>` is not directly assignable to Prisma's `InputJsonValue` type
- **Fix:** Added `as any` cast with explanatory comment — Record<string, unknown> is always valid JSON
- **Files modified:** `apps/api/src/routes/notifications.ts`, `apps/web/lib/actions/notification.ts`
- **Verification:** `pnpm tsc --noEmit` returns zero errors on web app

**2. [Rule 3 - Blocking] `ObraMembro` → `ObraMember` model name correction**
- **Found during:** Task 1 — writing getObraMemberIds
- **Issue:** Prisma schema uses `ObraMember` (not `ObraMembro` as I initially wrote)
- **Fix:** Corrected to `prisma.obraMember.findMany`
- **Files modified:** `apps/web/lib/actions/notification.ts`
- **Verification:** TypeScript compiles clean

---

**Total deviations:** 2 auto-fixed (1 type cast, 1 model name correction)
**Impact on plan:** Both trivial fixes. No scope creep.

## Issues Encountered

- Next.js build with stale `.next` cache produced flaky "ENOENT pages-manifest.json" errors. Fixed by deleting `.next` directory and rebuilding from clean. Pre-existing issue unrelated to this plan's changes.
- `pnpm turbo build` fails on `@obravision/db` (test file outside rootDir) — pre-existing, not introduced by this plan. Web-only build (`pnpm --filter web build`) passes cleanly.

## User Setup Required

- `NEXT_PUBLIC_API_URL` must be set in web app environment pointing to the Fastify API (e.g., `http://localhost:4000` for local dev). Without this, SocketProvider will connect to `localhost:4000` by default.
- `API_URL` in web server environment for server-side emitNotification calls (already documented in Plan 01 setup).

## Next Phase Readiness

- Socket.io infrastructure is complete — Plan 02 (pin/thread actions) can call `emitNotification` directly (TODOs added in planta.ts)
- `getObraMemberIds` utility is ready for pin/thread notification recipients
- All notification UI components are functional and integrated into the dashboard layout

---
*Phase: 02-pdf-viewer-anchored-comments*
*Completed: 2026-03-13*
