---
phase: 02-pdf-viewer-anchored-comments
plan: "01"
subsystem: pdf-upload-pipeline
tags: [prisma, r2, bullmq, pdfium, socket.io, vitest, planta, upload]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [Planta/PlantaRevisao DB models, R2 presigned upload flow, BullMQ PDF conversion worker, plant listing by disciplina, Vitest test infrastructure]
  affects: [02-02-PLAN.md, 02-03-PLAN.md]
tech_stack:
  added:
    - "@aws-sdk/client-s3@^3.x (web + api)"
    - "@aws-sdk/s3-request-presigner@^3.x (web + api)"
    - "@aws-sdk/lib-storage@^3.x (api)"
    - "bullmq@^5.x (api)"
    - "ioredis@^5.x (api)"
    - "@hyzyla/pdfium@^2.1.12 (api)"
    - "sharp@^0.34.x (api)"
    - "socket.io@^4.x (api)"
    - "vitest@^2.x (web + api)"
    - "@vitejs/plugin-react@^4.x (web)"
    - "jsdom@^28.x (web)"
  patterns:
    - "BullMQ queue + worker with maxRetriesPerRequest: null on IORedis connection"
    - "R2 presigned PUT URL — browser uploads directly to R2, key stored in DB"
    - "Normalized (0.0-1.0) pin coordinates for zoom/resize invariance"
    - "Socket.io attached directly to fastify.server (fastify-socket.io abandoned for Fastify 5)"
    - "Hybrid PDF rendering: small files direct, large files queued for WebP tile conversion"
key_files:
  created:
    - packages/db/prisma/schema.prisma (extended)
    - packages/db/prisma/migrations/00000000000002_planta_models/migration.sql
    - apps/web/lib/utils/coordinates.ts
    - apps/web/lib/validations/planta.ts
    - apps/web/lib/actions/planta.ts
    - apps/web/vitest.config.ts
    - apps/api/vitest.config.ts
    - apps/api/src/queues/pdf-conversion.queue.ts
    - apps/api/src/queues/pdf-conversion.worker.ts
    - apps/api/src/routes/plantas.ts
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/PlantaUploadForm.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/PlantaListByDisciplina.tsx
    - apps/web/tests/lib/coordinates.test.ts
    - apps/web/tests/actions/plantas.test.ts
    - apps/web/tests/actions/revisoes.test.ts
  modified:
    - apps/api/src/app.ts (Socket.io + route registration)
    - apps/web/next.config.ts (canvas: false webpack alias)
decisions:
  - "Vitest aliases: @projetapro/db/rls-client must be listed BEFORE @projetapro/db in alias map to prevent resolution overlap"
  - "listPlantasByObra returns Record<string, PlantaWithRevisoes[]> (not array) for direct group-by-disciplina iteration"
  - "Enqueue-conversion failure is non-fatal — logged but does not fail createRevisao (tiles will be ready eventually)"
  - "R2 key format: plantas/{tenantId}/{timestamp}-{filename} — tenantId embedded for auditing without DB lookup"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_created: 15
  files_modified: 3
  tests_added: 19
  tests_passing: 19
---

# Phase 2 Plan 1: PDF Upload Pipeline, Prisma Models, and Vitest Infrastructure Summary

**One-liner:** Prisma models for Planta/Revisao/Pin/Thread/Notification, R2 presigned upload with revision auto-numbering, BullMQ/PDFium/sharp WebP conversion pipeline, Socket.io on Fastify 5, plant listing grouped by disciplina, and Vitest infrastructure with 19 passing tests.

## What Was Built

### Data Layer (Prisma)

Six new models added to `schema.prisma`:

- **Planta** — Plant record with `disciplina` (DisciplinaTipo enum), `obraId` FK, soft delete
- **PlantaRevisao** — Revision record with `revisao` label (R0/R1/R2), mandatory `changelog`, `r2Key`, `tilesReady` flag, `tilesPrefix` for WebP tiles
- **Pin** — Anchored comment pin with normalized `x`, `y` floats (0.0-1.0) and `pageNumber`
- **Thread** — 1:1 with Pin, owns messages
- **ThreadMessage** — Individual thread message with `@mentions` array
- **Notification** — Multi-type notification record with JSON `payload`

RLS migration `00000000000002_planta_models/migration.sql` applies `ENABLE ROW LEVEL SECURITY` + `tenant_isolation` policy to all 6 new tables using the same `current_setting('app.current_tenant_id')` pattern from Phase 1.

### Upload Pipeline

`getPresignedUploadUrl` generates a presigned R2 PUT URL (1hr expiry). `PlantaUploadForm` uploads directly from browser to R2 via XHR with progress bar, then calls `createPlanta` + `createRevisao` server actions. Files >5MB trigger a fire-and-forget call to the Fastify API to enqueue BullMQ conversion.

### BullMQ Conversion Worker

`pdf-conversion.worker.ts` downloads the PDF from R2, renders each page at scale=2 (144 DPI) using `@hyzyla/pdfium`, converts to WebP (quality=85) via `sharp`, uploads tiles to `tiles/{plantaRevisaoId}/page-{N}.webp`, marks `PlantaRevisao.tilesReady = true`, and emits `tiles-ready` to the obra Socket.io room.

### Server Actions

| Action | Permission | Behavior |
|--------|------------|----------|
| `getPresignedUploadUrl` | Any authenticated | Returns `{ url, key }` for R2 direct upload |
| `createPlanta` | Admin + Engenheiro | Creates Planta with Zod validation |
| `createRevisao` | Admin + Engenheiro | Auto-numbers revision (R0→R1→R2), validates changelog, optionally migrates pins, enqueues conversion if >5MB |
| `deletePlanta` | Admin only | Soft delete |
| `deleteRevisao` | Admin only | Soft delete |
| `listPlantasByObra` | Any authenticated | Returns grouped by disciplina |

### UI Components

- `PlantaUploadForm` — Client component with upload progress bar, disciplina selector, changelog textarea, pin migration checkbox
- `PlantaListByDisciplina` — Server component grouping plants by disciplina with revision badges ("R2 atual")

### Vitest Infrastructure

Both `apps/web/vitest.config.ts` (jsdom environment, react plugin, path aliases) and `apps/api/vitest.config.ts` (node environment) configured. The web alias map places `@projetapro/db/rls-client` before `@projetapro/db` to prevent overlap.

## Test Results

```
19 tests passing across 3 test files:
  tests/lib/coordinates.test.ts   — 10 tests (clickToNormalized, normalizedToPixels)
  tests/actions/plantas.test.ts   — 4 tests (getPresignedUploadUrl key/url structure)
  tests/actions/revisoes.test.ts  — 5 tests (changelog required, R0/R1/R2 auto-increment)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest alias for @projetapro/db/rls-client missing**
- **Found during:** Task 2 — first test run
- **Issue:** Vitest config had `@projetapro/db` alias but not `@projetapro/db/rls-client`, causing resolution failure
- **Fix:** Added `@projetapro/db/rls-client` as explicit alias entry BEFORE `@projetapro/db` in vitest.config.ts
- **Files modified:** `apps/web/vitest.config.ts`

**2. [Rule 1 - Bug] listPlantasByObra returned `[]` (inferred never[]) on early return**
- **Found during:** Task 2 — TypeScript compile check
- **Issue:** `return []` on unauthenticated path caused TypeScript to infer `never[] | Record<string, ...>` union, breaking the component's ability to index the result
- **Fix:** Changed early returns to `return {}`, added explicit `Promise<Record<string, PlantaWithRevisoes[]>>` return type annotation, created exported `PlantaWithRevisoes` type
- **Files modified:** `apps/web/lib/actions/planta.ts`, `apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/PlantaListByDisciplina.tsx`

**3. [Rule 3 - Blocking] vi.mock factory referenced const before initialization (vitest hoisting)**
- **Found during:** Task 2 — revisoes.test.ts initial run
- **Issue:** `vi.mock("@projetapro/db", factory)` is hoisted to the top of the file; the factory referenced `mockTenantClient` which was a `const` declared later
- **Fix:** Used `vi.hoisted()` to create mutable mock variables accessible in factory scope. Also split the mock into separate `@projetapro/db` and `@projetapro/db/rls-client` mocks to prevent the Prisma singleton from instantiating (which caused DATABASE_URL errors)
- **Files modified:** `apps/web/tests/actions/revisoes.test.ts`

**4. [Rule 2 - Missing] @vitejs/plugin-react@6 requires vite@^8 (incompatible)**
- **Found during:** Task 1 — package install
- **Issue:** Latest @vitejs/plugin-react requires vite@^8 but project uses vite@5.x
- **Fix:** Pinned to `@vitejs/plugin-react@^4` and `vitest@^2` which is compatible with vite@5
- **Commit:** 7d660af

## User Setup Required

Before this feature is functional, the user must:

1. **R2 bucket configured** — Set `CF_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` env vars
2. **R2 CORS policy** — Configure bucket CORS to allow PUT from localhost:3000 and production domain
3. **Redis** — Set `REDIS_URL` pointing to Railway/Render Redis (NOT Upstash — BullMQ requires persistent TCP connection)
4. **Prisma migration** — Run `pnpm --filter @projetapro/db exec prisma db push` or `prisma migrate deploy` to create the new tables
5. **API_URL** — Set `API_URL` in web app env to point to Fastify API

## Self-Check: PASSED

All 10 checked files found on disk. Both task commits verified in git log (7d660af, d07c089).
