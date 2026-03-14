---
phase: 03-cronograma-rdo
plan: 03
subsystem: rdo
tags: [prisma, rdo, r2, open-meteo, server-actions, rls, svg-chart, react-hook-form]

# Dependency graph
requires:
  - phase: 03-cronograma-rdo
    plan: 01
    provides: Tarefa model with progressoReal field, Obra model with lat/lon

provides:
  - RdoEntrada and RdoFoto Prisma models with tenantId RLS policies
  - CRUD server actions: createRdoEntrada, getRdoPhotoUploadUrl, saveRdoFoto, getActiveTask, calcProgressoReal, getProgressData, listRdoEntradas, getCurrentWeather
  - RdoForm component with auto-fill task/weather, collapsible sections
  - RdoPhotoUpload component with browser-to-R2 presigned PUT
  - RdoCard read-only component with photo grid and expandable sections
  - ProgressWidget SVG S-curve chart (planned vs actual)
  - /dashboard/obras/[id]/rdo page (diary list)
  - /dashboard/obras/[id]/rdo/nova page (create entry)
  - Diario de Obra tab in ObraDetailClient
  - ProgressWidget on main dashboard

affects:
  - ObraDetailClient (Diario de Obra tab added)
  - Dashboard page (ProgressWidget added)
  - tarefa.progressoReal (auto-updated on diary creation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ProgressWidget uses pure SVG path-based S-curve chart — recharts not installed, no extra dependency needed"
    - "calcProgressoReal uses date-fns format() for distinct date deduplication via Set"
    - "getCurrentWeather is non-fatal — returns null on network error, weather fields remain blank for manual fill"
    - "RdoPhotoUpload does browser-to-R2 via presigned PUT, then calls saveRdoFoto server action to persist the record"
    - "getActiveTask is public server action (no auth redirect) using getTenantContextSafe pattern"

key-files:
  created:
    - packages/db/prisma/migrations/00000000000004_rdo_models/migration.sql
    - apps/web/lib/actions/rdo.ts
    - apps/web/components/rdo/RdoForm.tsx
    - apps/web/components/rdo/RdoPhotoUpload.tsx
    - apps/web/components/rdo/RdoCard.tsx
    - apps/web/components/cronograma/ProgressWidget.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/rdo/page.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/rdo/nova/page.tsx
    - apps/web/tests/actions/rdo.test.ts
  modified:
    - packages/db/prisma/schema.prisma
    - apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx
    - apps/web/app/(dashboard)/dashboard/page.tsx

key-decisions:
  - "ProgressWidget uses pure SVG instead of recharts — recharts is not in package.json, and SVG provides sufficient S-curve rendering without additional dependencies"
  - "getTenantContextSafe helper pattern (returns null instead of redirect) used for read-only actions (getActiveTask, listRdoEntradas, calcProgressoReal, getProgressData) — called in client components and GET contexts"
  - "db push skipped — no DATABASE_URL in dev env; RLS migration SQL created manually as 00000000000004_rdo_models"
  - "nanoid substitute for R2 key: Date.now().toString(36) + Math.random().toString(36) — avoids adding nanoid dependency for a simple unique prefix"

# Metrics
duration: 8min
completed: 2026-03-13
---

# Phase 3 Plan 03: RDO (Diario de Obra) Summary

**RdoEntrada/RdoFoto Prisma models with RLS, server actions for diary CRUD + R2 photo upload + active task auto-detection + progress calculation, diary form with auto-filled weather from Open-Meteo, and SVG S-curve dashboard widget**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T23:34:57Z
- **Completed:** 2026-03-13T23:42:50Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Added `RdoEntrada` model: @@unique([obraId, data]) one-per-obra-per-day constraint, tenantId RLS indexes, all weather/clima fields, Json? for maoDeObra/materiais
- Added `RdoFoto` model: r2Key, legenda, ordem, rdoEntradaId FK, tenantId RLS indexes
- Added rdoEntradas relation on both Obra and Tarefa models
- Created RLS migration SQL (00000000000004) with RLS policies for both new tables
- Implemented all 8 server actions in `rdo.ts`: createRdoEntrada (RBAC), getRdoPhotoUploadUrl, saveRdoFoto, getActiveTask, calcProgressoReal, getProgressData, listRdoEntradas, getCurrentWeather (Open-Meteo)
- `calcProgressoReal` uses distinct date deduplication with Set + date-fns format, capped at 100%
- `createRdoEntrada` auto-calls calcProgressoReal and updates tarefa.progressoReal when tarefaId provided
- `RdoForm`: react-hook-form + Zod, auto-detects active task on date change, auto-fetches weather (Open-Meteo) when obra has lat/lon, all optional expandable sections (maoDeObra/materiais/ocorrencias)
- `RdoPhotoUpload`: multi-file browser-to-R2 presigned PUT upload with progress spinner, legenda input, up/down reorder
- `RdoCard`: read-only diary entry with photo thumbnail grid, lightbox expand, expandable optional sections
- `ProgressWidget`: pure SVG S-curve chart with planned (dark green) vs actual (lighter green dashed) lines, Y-axis ticks, X-axis date labels
- Diary list page at `/rdo` with empty state and Nova Entrada button (ADMIN/ENGENHEIRO only)
- Nova entry page at `/rdo/nova` with ADMIN/ENGENHEIRO gate, loads tarefa list for selector
- Added Diario de Obra tab link in ObraDetailClient
- Added ProgressWidget to dashboard for first active obra
- 15 tests pass (calcProgressoReal: 30%/0%/capped-100%/null, getActiveTask: match/null/earliest, createRdoEntrada: ADMIN/ENGENHEIRO/CLIENTE rejection, listRdoEntradas, progressoReal update)

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests** - `fa9b5a4` (test)
2. **Task 1: Prisma schema + server actions** - `5884119` (feat)
3. **Task 2: RDO UI components + pages** - `b9fe30b` (feat)

## Files Created/Modified

- `packages/db/prisma/schema.prisma` - Added RdoEntrada/RdoFoto models, rdoEntradas relations on Obra+Tarefa
- `packages/db/prisma/migrations/00000000000004_rdo_models/migration.sql` - CREATE TABLE + RLS policies for rdo_entradas + rdo_fotos
- `apps/web/lib/actions/rdo.ts` - 8 server actions with Zod validation, RBAC, R2, Open-Meteo
- `apps/web/components/rdo/RdoForm.tsx` - Diary entry form with auto-fill + collapsible sections
- `apps/web/components/rdo/RdoPhotoUpload.tsx` - Multi-photo browser-to-R2 upload component
- `apps/web/components/rdo/RdoCard.tsx` - Read-only diary entry card with lightbox
- `apps/web/components/cronograma/ProgressWidget.tsx` - SVG S-curve progress chart
- `apps/web/app/(dashboard)/dashboard/obras/[id]/rdo/page.tsx` - Diary list server page
- `apps/web/app/(dashboard)/dashboard/obras/[id]/rdo/nova/page.tsx` - New entry server page
- `apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx` - Added Diario de Obra tab
- `apps/web/app/(dashboard)/dashboard/page.tsx` - Added ProgressWidget + getProgressData call
- `apps/web/tests/actions/rdo.test.ts` - 15 unit tests

## Decisions Made

- `ProgressWidget` uses pure SVG path rendering instead of recharts — recharts is not installed and a lightweight SVG chart avoids adding a dependency for a relatively simple visualization.
- `getTenantContextSafe` helper pattern introduced (returns null instead of redirect) — needed for server actions called from client components via server action invocation, where a redirect would break the UX.
- `db push` skipped — no DATABASE_URL in dev env. RLS migration SQL created manually. Developer applies with `pnpm --filter @projetapro/db db:push`.
- nanoid substitute (timestamp base-36 + random chars) used for R2 key uniqueness — avoids adding the nanoid package for a simple random prefix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] recharts not available for ProgressWidget**
- **Found during:** Task 2 (ProgressWidget implementation)
- **Issue:** Plan specified recharts for S-curve chart, but recharts is not in package.json
- **Fix:** Implemented ProgressWidget using pure SVG `<path>` elements with linear scaling. Two lines (planned/actual) rendered correctly with grid lines, Y-axis ticks, and X-axis date labels.
- **Files modified:** apps/web/components/cronograma/ProgressWidget.tsx
- **Commit:** b9fe30b

**2. [Rule 3 - Blocking] DATABASE_URL not configured — db push skipped**
- **Found during:** Task 1 (Prisma schema)
- **Issue:** No .env file; `prisma db push` requires DATABASE_URL (same as Plan 01)
- **Fix:** Created RLS migration SQL manually. Schema validated with DATABASE_URL dummy.
- **Files modified:** packages/db/prisma/migrations/00000000000004_rdo_models/migration.sql
- **Commit:** 5884119

---

**Total deviations:** 2 auto-handled (Rule 3 — blocking issues)
**Impact on plan:** All functionality delivered. SVG chart renders correctly. db push is a one-command developer step.

## User Setup Required

Developer must run `pnpm --filter @projetapro/db db:push` with DATABASE_URL set to apply RdoEntrada/RdoFoto schema changes.

## Next Phase Readiness

- Phase 3 Plan 03 (RDO) complete — closes the field-execution loop with office planning
- All three Phase 3 plans (Cronograma, Weather Alerts, RDO) are now complete
- Phase 4 can proceed (mobile offline sync if planned)

---
*Phase: 03-cronograma-rdo*
*Completed: 2026-03-13*

## Self-Check: PASSED

All files created/modified confirmed on disk. All commits confirmed in git log.
- FOUND: apps/web/lib/actions/rdo.ts
- FOUND: apps/web/components/rdo/RdoForm.tsx
- FOUND: apps/web/components/rdo/RdoPhotoUpload.tsx
- FOUND: apps/web/components/rdo/RdoCard.tsx
- FOUND: apps/web/components/cronograma/ProgressWidget.tsx
- FOUND: apps/web/app/(dashboard)/dashboard/obras/[id]/rdo/page.tsx
- FOUND: apps/web/app/(dashboard)/dashboard/obras/[id]/rdo/nova/page.tsx
- FOUND: apps/web/tests/actions/rdo.test.ts
- FOUND: packages/db/prisma/migrations/00000000000004_rdo_models/migration.sql
- FOUND: .planning/phases/03-cronograma-rdo/03-03-SUMMARY.md
- COMMIT fa9b5a4: TDD RED
- COMMIT 5884119: Task 1
- COMMIT b9fe30b: Task 2
