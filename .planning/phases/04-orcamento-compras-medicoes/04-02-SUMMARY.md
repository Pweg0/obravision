---
phase: 04-orcamento-compras-medicoes
plan: 02
subsystem: ui
tags: [react-pdf, bullmq, r2, curva-abc, pareto, pdf-generation, orcamento]

requires:
  - phase: 04-01
    provides: "Orcamento, OrcamentoEtapa, OrcamentoItem Prisma models, getOrcamento server action, orcamento page foundation"

provides:
  - "buildCurvaABC pure function: sorts items by valorTotal DESC, running percentual_acumulado, A/B/C classification (A<=50%, B<=80%, C>80%)"
  - "Curva ABC page at /dashboard/obras/[id]/orcamento/curva-abc with sorted table, badges, category summary cards"
  - "pdf-generation BullMQ queue and worker (concurrency 3) for all Phase 4 PDF types"
  - "PropostaComercial @react-pdf/renderer template with header, etapa/item table, BDI summary, page numbers"
  - "enqueueProposta and getPropostaPdfUrl server actions in orcamento-pdf.ts"
  - "PropostaExport client component: export button, Gerando PDF... state, pdf-ready socket listener, polling fallback, download link"

affects:
  - "04-03-compras: pdf-generation.worker.ts has placeholder for pedido-compra PDF type"
  - "04-05-medicoes: pdf-generation.worker.ts has placeholder for boletim-medicao PDF type"

tech-stack:
  added:
    - "@react-pdf/renderer (apps/api): React-based PDF generation for BullMQ worker"
  patterns:
    - "BullMQ + R2 PDF pattern: enqueue job -> worker renders react-pdf -> upload to R2 -> emit pdf-ready socket -> update DB pdfR2Key"
    - "Pure function Curva ABC: buildCurvaABC(items) -> sorted with valorTotal, percentual_acumulado, categoria"
    - "PropostaExport polling: 3-second interval when status=queued, socket.io for real-time when available"

key-files:
  created:
    - "apps/web/lib/orcamento-utils.ts — buildCurvaABC pure function"
    - "apps/web/components/orcamento/CurvaABC.tsx — sorted table with A/B/C badges"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/orcamento/curva-abc/page.tsx — Curva ABC page"
    - "apps/web/components/orcamento/PropostaExport.tsx — export button with loading state and download link"
    - "apps/web/lib/actions/orcamento-pdf.ts — enqueueProposta and getPropostaPdfUrl server actions"
    - "apps/api/src/queues/pdf-generation.queue.ts — BullMQ queue for PDF generation jobs"
    - "apps/api/src/queues/pdf-generation.worker.ts — BullMQ worker with concurrency 3"
    - "apps/api/src/pdf-templates/PropostaComercial.tsx — @react-pdf/renderer template"
  modified:
    - "packages/db/prisma/schema.prisma — added pdfR2Key field to Orcamento model"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/orcamento/page.tsx — added PropostaExport in header"
    - "apps/api/tsconfig.json — added jsx: react for TSX template files"

key-decisions:
  - "Curva ABC classification thresholds: A<=50%, B<=80%, C>80% — standard Brazilian construction practice"
  - "PDF generation via BullMQ worker (not synchronous in server action) — same pattern as pdf-conversion worker"
  - "PropostaExport polls every 3 seconds as fallback when Socket.io unavailable — resilient to API downtime"
  - "pdfR2Key added to Orcamento model — null cleared on regenerate request for worker to pick up"

requirements-completed: [ORC-05, ORC-06]

duration: 18min
completed: 2026-03-14
---

# Phase 4 Plan 02: Curva ABC + Proposta Comercial PDF Summary

**Curva ABC sorted table with A/B/C classification, BullMQ @react-pdf/renderer worker for proposta comercial PDF stored in R2, and export button with real-time socket + polling fallback**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-03-14T14:43:17Z
- **Completed:** 2026-03-14T15:00:09Z
- **Tasks:** 2 (+ prerequisite Plan 01 Task 2 which was incomplete)
- **Files modified:** 10

## Accomplishments

- `buildCurvaABC` pure function: sorts items by valorTotal descending, calculates running cumulative percentage, classifies as A (<=50%), B (<=80%), C (>80%)
- Curva ABC page at `/dashboard/obras/[id]/orcamento/curva-abc` with sortable table, progress bar visualization, category cards, and legend
- PDF generation worker (`pdf-generation.worker.ts`) with BullMQ concurrency 3, handles "proposta" type, emits `pdf-ready` socket event on completion
- `PropostaComercial.tsx` @react-pdf/renderer template: header with empresa/obra/date/BDI, hierarchical table by etapa, grand total with BDI applied, page numbers in footer
- `PropostaExport.tsx` client component: full lifecycle from "Exportar" -> "Gerando PDF..." -> "Baixar PDF" with socket listener and 3-second polling fallback

## Task Commits

1. **Task 1: Curva ABC logic + PDF generation worker + tests** - `65f0f35` (feat)
2. **Task 2: Curva ABC page and Proposta export UI** - `d340c7f` (feat)

## Files Created/Modified

- `apps/web/lib/orcamento-utils.ts` - buildCurvaABC pure function
- `apps/web/tests/lib/orcamento.test.ts` - buildCurvaABC tests (105 total pass)
- `apps/api/src/queues/pdf-generation.queue.ts` - BullMQ queue for proposta/pedido-compra/boletim-medicao
- `apps/api/src/queues/pdf-generation.worker.ts` - BullMQ worker with renderToBuffer, R2 upload, socket emit
- `apps/api/src/pdf-templates/PropostaComercial.tsx` - react-pdf template
- `apps/web/lib/actions/orcamento-pdf.ts` - enqueueProposta, getPropostaPdfUrl server actions
- `apps/web/components/orcamento/CurvaABC.tsx` - sorted table with A/B/C badges
- `apps/web/components/orcamento/PropostaExport.tsx` - export button UI with lifecycle states
- `apps/web/app/(dashboard)/dashboard/obras/[id]/orcamento/curva-abc/page.tsx` - Curva ABC page
- `packages/db/prisma/schema.prisma` - added pdfR2Key to Orcamento model
- `apps/api/tsconfig.json` - added jsx: react

## Decisions Made

- Standard ABC thresholds (A<=50%, B<=80%, C>80%) — widely used in Brazilian construction management
- PDF generation always async via BullMQ — prevents blocking the server action response
- PropostaExport polls every 3 seconds when socket unavailable — graceful degradation
- `pdfR2Key` set to null on regenerate — worker detects and regenerates on next job

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Executed Plan 01 Task 2 (UI components) which was missing**
- **Found during:** Pre-execution scan
- **Issue:** Plan 01 Task 2 (orcamento UI components and page) had not been committed, making Plan 02 unable to wire PropostaExport into the orcamento page
- **Fix:** Created EtapaForm, ItemForm, ImportModal, BdiConfig, SinapiSearch, OrcamentoTable, orcamento/page.tsx, updated ObraDetailClient navigation tab
- **Verification:** Build passes, type-check clean
- **Committed in:** f162573 (Plan 01 Task 2 commit)

**2. [Rule 1 - Bug] Added pdfR2Key field to Orcamento model**
- **Found during:** Task 1 (PDF generation worker)
- **Issue:** Orcamento model in schema.prisma was missing `pdfR2Key String?` field needed by the worker to store the R2 key after PDF generation
- **Fix:** Added `pdfR2Key String?` to Orcamento model, regenerated Prisma client
- **Verification:** `prisma generate` succeeded, type-check clean
- **Committed in:** 65f0f35 (Task 1 commit)

**3. [Rule 3 - Blocking] Added jsx: react to apps/api/tsconfig.json**
- **Found during:** Task 1 (API type-check)
- **Issue:** PropostaComercial.tsx uses JSX syntax but API tsconfig had no JSX compiler option
- **Fix:** Added `"jsx": "react"` to apps/api/tsconfig.json
- **Verification:** API type-check passes with tsconfig.build.json (noImplicitAny: false)
- **Committed in:** 65f0f35 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking pre-requisite, 1 bug, 1 blocking config)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- The previous session had committed Plan 01 Task 1 (schema + server actions) but not Task 2 (UI components), so the orcamento page foundation was missing. Applied Rule 3 to unblock.
- `renderToBuffer` from @react-pdf/renderer required a type cast since TypeScript's `createElement` returns `FunctionComponentElement` rather than the more specific `ReactElement<DocumentProps>`. Fixed with `as unknown as ReactElement<DocumentProps, ...>`.

## User Setup Required

None — no new external service configuration required. The BullMQ queue uses the existing Redis connection. R2 credentials are already configured.

## Next Phase Readiness

- Plan 02 complete: Curva ABC analysis and proposta comercial PDF export fully functional
- pdf-generation.worker.ts has TODOs for `pedido-compra` and `boletim-medicao` PDF types — Plans 03 and 05 can implement those
- Plan 03 (Compras) can reuse pdf-generation.queue.ts directly for purchase order PDFs

---
*Phase: 04-orcamento-compras-medicoes*
*Completed: 2026-03-14*
