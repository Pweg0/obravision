---
phase: 04-orcamento-compras-medicoes
plan: 06
subsystem: database
tags: [prisma, pdf, r2, medicao, boletim, s3-presigned-url]

# Dependency graph
requires:
  - phase: 04-orcamento-compras-medicoes
    provides: MedicaoFisica and MedicaoContrato models, pdf-generation.worker, getBoletimPdfUrl action
provides:
  - pdfR2Key String? field on MedicaoFisica model
  - Migration 00000000000006_add_pdfr2key_to_medicao_fisica
  - Worker stores pdfR2Key to MedicaoFisica after R2 upload
  - getBoletimPdfUrl accepts type param and queries fisica or contrato
  - MedicaoFisicaDetailClient has Baixar PDF download button
affects: [medicoes, pdf-download, boletim]

# Tech tracking
tech-stack:
  added: []
  patterns: [symmetric-pdf-download-for-fisica-and-contrato]

key-files:
  created:
    - packages/db/prisma/migrations/00000000000006_add_pdfr2key_to_medicao_fisica/migration.sql
  modified:
    - packages/db/prisma/schema.prisma
    - apps/api/src/queues/pdf-generation.worker.ts
    - apps/web/lib/actions/medicoes.ts
    - apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/fisica/[medicaoId]/MedicaoFisicaDetailClient.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/contrato/[medicaoId]/MedicaoContratoDetailClient.tsx

key-decisions:
  - "getBoletimPdfUrl type param uses conditional query (fisica vs contrato) — single function handles both, no duplication"
  - "Migration created manually (no local DATABASE_URL) — ALTER TABLE MedicaoFisica ADD COLUMN pdfR2Key TEXT"

patterns-established:
  - "PDF download parity: fisica and contrato boletim flows are now symmetric (generate + download)"
  - "getBoletimPdfUrl(type, id) pattern: type-discriminated server action for presigned URL retrieval"

requirements-completed: [MED-01]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 04 Plan 06: MedicaoFisica Boletim PDF Download Summary

**pdfR2Key added to MedicaoFisica schema with migration, worker now persists key after R2 upload, and download button added to fisica UI — full download parity with MedicaoContrato**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T15:52:57Z
- **Completed:** 2026-03-14T15:56:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- MedicaoFisica model now has `pdfR2Key String?` field (matches MedicaoContrato)
- `pdf-generation.worker.ts` now saves `pdfR2Key` to MedicaoFisica after R2 upload (removed "no pdfR2Key field" comment block)
- `getBoletimPdfUrl` extended with `type: "fisica" | "contrato"` parameter — queries both models
- `MedicaoFisicaDetailClient` has "Baixar PDF" button calling `getBoletimPdfUrl("fisica", medicao.id)` — UX symmetric with contrato
- `MedicaoContratoDetailClient` updated to pass `"contrato"` type arg — existing flow unbroken

## Task Commits

Each task was committed atomically:

1. **Task 1: Add pdfR2Key to schema, update worker + server action** - `fd65463` (feat)
2. **Task 2: Add download button to MedicaoFisicaDetailClient** - `dba8280` (feat)

**Plan metadata:** `(pending final commit)` (docs: complete plan)

## Files Created/Modified

- `packages/db/prisma/schema.prisma` - Added `pdfR2Key String?` to MedicaoFisica model
- `packages/db/prisma/migrations/00000000000006_add_pdfr2key_to_medicao_fisica/migration.sql` - ALTER TABLE adding nullable TEXT column
- `apps/api/src/queues/pdf-generation.worker.ts` - Added `prisma.medicaoFisica.update({ data: { pdfR2Key } })` after R2 upload
- `apps/web/lib/actions/medicoes.ts` - `getBoletimPdfUrl` now accepts `type` param and queries fisica or contrato
- `apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/fisica/[medicaoId]/MedicaoFisicaDetailClient.tsx` - Added `handleDownloadPdf` and "Baixar PDF" button
- `apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/contrato/[medicaoId]/MedicaoContratoDetailClient.tsx` - Updated call to `getBoletimPdfUrl("contrato", medicao.id)`

## Decisions Made

- `getBoletimPdfUrl` uses a single type-discriminated function rather than two separate functions — avoids API surface duplication and follows the pattern already used by `approveMedicao` and `exportBoletim`.
- Migration created manually (ALTER TABLE) because no local DATABASE_URL is configured — same approach as prior phase migrations in this project.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `prisma migrate dev` requires a live DATABASE_URL connection; none configured locally. Resolved by creating migration SQL manually (ALTER TABLE statement) — consistent with how prior migrations in this project were handled. `prisma generate` succeeded with a placeholder URL.
- Pre-existing TypeScript errors in `apps/web/tests/actions/compras.test.ts` (missing `urgente` field) and `apps/api` rootDir configuration issue — both out of scope and logged to deferred items.

## User Setup Required

None - no external service configuration required. The migration will be applied automatically on next deployment via Railway's migrate-on-deploy pattern.

## Next Phase Readiness

- MedicaoFisica PDF download is now fully functional end-to-end (generate via Exportar Boletim → notification → download via Baixar PDF)
- Both fisica and contrato boletim flows are symmetric
- No blockers for next phase

---
*Phase: 04-orcamento-compras-medicoes*
*Completed: 2026-03-14*
