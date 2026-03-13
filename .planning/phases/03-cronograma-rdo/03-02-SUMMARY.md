---
phase: 03-cronograma-rdo
plan: 02
subsystem: api+web
tags: [bullmq, open-meteo, nominatim, geocoding, weather-alerts, notifications, gantt, date-fns]

# Dependency graph
requires:
  - phase: 03-cronograma-rdo
    plan: "01"
    provides: Etapa/Tarefa Prisma models, lat/lon on Obra, GanttView component, listCronograma action
  - phase: 02-pdf-viewer-anchored-comments
    provides: Notification model, Socket.io emit pattern, emitNotification, createTenantClient

provides:
  - BullMQ weather-alert queue with daily 07:00 BRT cron via upsertJobScheduler
  - detectWeatherAlerts pure function (weather-detection.ts) — testable without Redis
  - Weather alert worker: queries obras with lat/lon, fetches Open-Meteo, creates Notification records
  - geocodeAddress helper in obra.ts: Nominatim → { lat, lon } | null
  - createObra/updateObra geocode address post-save (non-fatal fallback)
  - listCronograma augmented with temAlertaChuva per tarefa (from Notification table)
  - GanttView CloudRain alert panel for tarefas with active weather alerts

affects:
  - 03-03-rdo (no direct impact — RDO completed in parallel)
  - Notification table used as weather alert store (types: weather_preliminary, weather_confirmed)

# Tech tracking
tech-stack:
  added:
    - "date-fns in api package (UTC day arithmetic for weather detection)"
    - "lucide-react CloudRain icon in GanttView (already installed)"
  patterns:
    - "detectWeatherAlerts extracted to weather-detection.ts — pure function isolated from BullMQ Worker instantiation for clean unit testing"
    - "All date comparisons in weather detection use UTC toISOString().slice(0,10) — avoids local-timezone drift in tests"
    - "geocodeAddress is best-effort: obra saves even if Nominatim is unreachable"
    - "Weather alerts stored in existing Notification table — no new model needed"
    - "listCronograma queries Notification table for active alerts (alertDate in future) and attaches temAlertaChuva to each tarefa"

key-files:
  created:
    - apps/api/src/queues/weather-alert.queue.ts
    - apps/api/src/queues/weather-alert.worker.ts
    - apps/api/src/queues/weather-detection.ts
    - apps/api/tests/workers/weather-alert.test.ts
    - apps/web/tests/actions/obra-geocoding.test.ts
  modified:
    - apps/api/src/app.ts
    - apps/web/lib/actions/obra.ts
    - apps/web/lib/actions/cronograma.ts
    - apps/web/components/cronograma/GanttView.tsx
    - apps/web/tests/actions/cronograma.test.ts
    - apps/api/package.json
    - pnpm-lock.yaml

key-decisions:
  - "detectWeatherAlerts extracted to separate weather-detection.ts module — BullMQ Worker instantiation at module level requires Redis connection; tests import pure function directly to avoid Redis dependency"
  - "UTC-based date string comparison (toISOString().slice(0,10)) in detectWeatherAlerts — avoids local-timezone off-by-one in environments where node TZ != UTC"
  - "Weather alerts stored in Notification table with types weather_preliminary / weather_confirmed — no new DB model needed; leverages existing Phase 2 infrastructure"
  - "listCronograma queries Notification table directly via prisma (not tenantClient) — Notification is userId-scoped; we filter by tenantId + type + payload.tarefaId in JS"
  - "GanttView weather alert panel rendered as a section above the Gantt chart — @svar-ui/react-gantt has no built-in custom cell renderer in standard config; orange/red color coding for preliminary/confirmed"

requirements-completed:
  - CRON-03

# Metrics
duration: 13min
completed: 2026-03-13
---

# Phase 3 Plan 02: Weather Alerts + Geocoding Summary

**BullMQ weather-alert cron job with Open-Meteo forecast, Nominatim geocoding on Obra save, dual-level (preliminary/confirmed) rain alerts via Notification table, and CloudRain visual indicator in GanttView**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-13T23:34:49Z
- **Completed:** 2026-03-13T23:47:49Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Created `weather-alert.queue.ts` with `WeatherAlertJobData`, `weatherAlertQueue` (same Redis + retry config as pdf-conversion), and `registerWeatherAlertScheduler()` (daily 07:00 BRT via `upsertJobScheduler`)
- Extracted `detectWeatherAlerts` pure function into `weather-detection.ts` — accepts tarefas + forecast days + reference date; returns `WeatherAlert[]` with `alertType: "weather_preliminary" | "weather_confirmed"`
- Created `weather-alert.worker.ts` — BullMQ worker that queries obras with lat/lon, skips obras without coordinates, fetches Open-Meteo per obra, runs detection logic, creates `prisma.notification.createMany` records for ADMIN+ENGENHEIRO members, emits `weather-alert` socket event (non-fatal)
- Updated `app.ts` to call `registerWeatherAlertScheduler()` and inject `fastify.io` into the weather worker at startup
- Added `geocodeAddress()` to `obra.ts` — Nominatim call with `User-Agent: ObraVision/1.0`, returns `{ lat, lon } | null`, all errors caught non-fatally
- Wired geocoding into `createObra` (post-create update) and `updateObra` (re-geocode when address fields present)
- Updated `listCronograma` to query `prisma.notification` for active weather alerts and attach `temAlertaChuva: "weather_preliminary" | "weather_confirmed" | null` to each tarefa
- Updated `GanttView.tsx` to render a weather alert panel (orange/red CloudRain icons) above the Gantt for tarefas with active alerts
- 8 unit tests for `detectWeatherAlerts` (dual levels, climate sensitivity inheritance, threshold filtering, UTC timezone safety)
- 7 unit tests for `geocodeAddress` and `createObra` geocoding integration (success, empty results, network failure, HTTP 429, Nominatim format validation)

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for weather detection** - `75d5937` (test)
2. **Task 1: Weather alert BullMQ queue, worker, geocoding** - `fc1a5e8` (feat)
3. **TDD RED: Failing tests for obra geocoding** - `92a016b` (test)
4. **Task 2: Geocoding + listCronograma + GanttView rain icon** - `2e9f9f2` (feat)

## Files Created/Modified

- `apps/api/src/queues/weather-alert.queue.ts` - WeatherAlertJobData, weatherAlertQueue, registerWeatherAlertScheduler
- `apps/api/src/queues/weather-detection.ts` - Pure detectWeatherAlerts function (UTC-safe, no BullMQ/Redis dependency)
- `apps/api/src/queues/weather-alert.worker.ts` - BullMQ worker: Open-Meteo fetch, notification creation, socket emit
- `apps/api/src/app.ts` - Register weather scheduler + inject io at startup
- `apps/api/tests/workers/weather-alert.test.ts` - 8 unit tests for detectWeatherAlerts
- `apps/web/lib/actions/obra.ts` - Added geocodeAddress helper, wired into createObra + updateObra
- `apps/web/lib/actions/cronograma.ts` - listCronograma now queries Notification for active weather alerts
- `apps/web/components/cronograma/GanttView.tsx` - Added CloudRain alert panel, temAlertaChuva in TarefaData interface
- `apps/web/tests/actions/obra-geocoding.test.ts` - 7 unit tests for geocodeAddress + createObra geocoding
- `apps/web/tests/actions/cronograma.test.ts` - Added prisma.notification mock, updated listCronograma assertion

## Decisions Made

- `detectWeatherAlerts` lives in `weather-detection.ts` (not `weather-alert.worker.ts`) — BullMQ `new Worker(...)` runs at module load and requires a Redis connection; separating the pure function prevents test suites from needing a live Redis server.
- UTC ISO date string comparison (`toISOString().slice(0,10)`) is used throughout weather detection instead of `startOfDay` from date-fns — avoids local-timezone offset bugs on systems where the runtime TZ is not America/Sao_Paulo.
- Weather alerts reuse the existing `Notification` table (types `weather_preliminary` / `weather_confirmed`) rather than a new `WeatherAlert` model — simpler, no migration needed, works with existing notification bell/badge/sound UI.
- `listCronograma` queries `prisma.notification` directly (raw prisma, not tenantClient) — the `Notification` model doesn't have an RLS policy; tenantId filtering is applied manually in the where clause.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BullMQ Worker instantiation at module load blocks unit tests**
- **Found during:** Task 1 (TDD GREEN)
- **Issue:** `new Worker("weather-alert", ...)` executes at module load time and requires a Redis connection. Importing `weather-alert.worker.ts` from tests caused `Worker requires a connection` error.
- **Fix:** Extracted `detectWeatherAlerts` and its types into a separate `weather-detection.ts` module with zero external dependencies. Tests import from `weather-detection.ts` directly.
- **Files modified:** `apps/api/src/queues/weather-detection.ts` (created), `apps/api/tests/workers/weather-alert.test.ts`
- **Commit:** `fc1a5e8`

**2. [Rule 1 - Bug] UTC timezone drift in test date construction**
- **Found during:** Task 1 (TDD GREEN)
- **Issue:** Test dates built with `new Date("2026-01-01T00:00:00Z")` + local `setDate(getDate() + N)` produced different ISO strings than the implementation's UTC-based computation, causing 5 test failures on Windows (UTC offset causes getDate() to return the previous day).
- **Fix:** Rewrote both the test helper and `detectWeatherAlerts` to use UTC day arithmetic (`setUTCDate(getUTCDate() + N)`) and ISO string slice (`toISOString().slice(0,10)`) for all date comparisons.
- **Files modified:** `apps/api/src/queues/weather-detection.ts`, `apps/api/tests/workers/weather-alert.test.ts`
- **Commit:** `fc1a5e8`

**3. [Rule 1 - Bug] CEP validation rejects dashed format in createObra tests**
- **Found during:** Task 2 (TDD GREEN)
- **Issue:** The Zod `obraSchema` validates CEP as `^\d{8}$` (8 digits, no dash). Test FormData used `"01310-100"` (with dash), causing `safeParse` to fail and return `{ error: ... }` instead of `{ success: true }`.
- **Fix:** Changed test FormData CEP values to `"01310100"` (8 digits).
- **Files modified:** `apps/web/tests/actions/obra-geocoding.test.ts`
- **Commit:** `2e9f9f2`

**4. [Rule 2 - Missing] cronograma.test.ts missing `prisma.notification` mock**
- **Found during:** Task 2 (all web tests)
- **Issue:** After updating `listCronograma` to call `prisma.notification.findMany`, the existing cronograma test mock only had `prisma.empresa`. The test threw `Cannot read properties of undefined (reading 'findMany')`.
- **Fix:** Added `notification: { findMany: vi.fn().mockResolvedValue([]) }` to the `@obravision/db` mock in `cronograma.test.ts`. Also updated the `listCronograma` result assertion to use `objectContaining` to accommodate the new `temAlertaChuva` field on tarefas.
- **Files modified:** `apps/web/tests/actions/cronograma.test.ts`
- **Commit:** `2e9f9f2`

---

**Total deviations:** 4 auto-handled (Rules 1 and 2)
**Impact on plan:** No scope changes. All fixes were within the task boundary. Final test count is 95 (13 API + 82 web), all passing.

## User Setup Required

No new setup required beyond what Plan 01 already documented:
- `pnpm --filter @obravision/db exec prisma db push` (when DATABASE_URL is available) — applies the Obra lat/lon columns from Plan 01's schema change.
- Redis must be running for the weather-alert BullMQ worker to process jobs.
- Open-Meteo API is free, no key required.

## Next Phase Readiness

- Plan 03 (RDO) was already completed in a parallel session.
- Phase 3 is complete: Cronograma schema (01), Weather alerts (02), RDO diary (03).
- Phase 4 (mobile offline + Expo) can begin; it requires Tarefa + RdoEntrada models which are now in place.

---
*Phase: 03-cronograma-rdo*
*Completed: 2026-03-13*

## Self-Check: PASSED

All files created, commits verified:
- `apps/api/src/queues/weather-alert.queue.ts` — FOUND
- `apps/api/src/queues/weather-alert.worker.ts` — FOUND
- `apps/api/src/queues/weather-detection.ts` — FOUND
- `apps/api/tests/workers/weather-alert.test.ts` — FOUND
- `apps/web/tests/actions/obra-geocoding.test.ts` — FOUND
- `.planning/phases/03-cronograma-rdo/03-02-SUMMARY.md` — FOUND
- Commit `fc1a5e8` — FOUND
- Commit `2e9f9f2` — FOUND
