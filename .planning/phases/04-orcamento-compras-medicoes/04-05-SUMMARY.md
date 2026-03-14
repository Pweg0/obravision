---
phase: 04-orcamento-compras-medicoes
plan: 05
subsystem: medicoes
tags: [server-actions, tdd, react-pdf, bullmq, decimal.js, weighted-progress, boletim]
dependency_graph:
  requires:
    - phase: 04-01
      provides: "Prisma schema with MedicaoFisica, MedicaoContrato, OrcamentoItem models"
    - phase: 04-02
      provides: "pdf-generation.worker.ts with BullMQ + R2 + socket pattern"
    - phase: 04-03
      provides: "pdf-queue-client.ts HTTP wrapper, emitNotification pattern"
  provides:
    - "calcularProgressoPonderado pure function using Decimal.js"
    - "createMedicaoFisica: auto-generates MedicaoFisicaItem per OrcamentoItem"
    - "updateMedicaoFisicaItem: recalculates progressoGeral on each update"
    - "createMedicaoContrato: free-text empreiteiro stored in empreiteiroId field"
    - "getMedicaoContrato: returns cumulative acumulado from prior periods (MED-02)"
    - "approveMedicao: ADMIN-only (locked decision — ENGENHEIRO cannot approve)"
    - "exportBoletim: enqueues boletim-medicao BullMQ job"
    - "BoletimMedicao.tsx: react-pdf template for fisica and contrato"
    - "Medicoes page at /dashboard/obras/[id]/medicoes with both sections"
    - "Fisica detail with range sliders and live weighted progress"
    - "Contrato detail with inline add-item form and acumulado history"
  affects: []
tech_stack:
  added: []
  patterns:
    - "calcularProgressoPonderado: SUM(valorTotal * pct/100) / SUM(valorTotal) * 100 using Decimal.js"
    - "Schema adaptation: empreiteiroNome stored as empreiteiroId (free-text), CNPJ in contrato field"
    - "progressoGeral computed on demand (not stored) — MedicaoFisica has no progressoGeral column"
    - "TDD red-green: failing tests committed first (2eace87), implementation after (8f005ee)"
key_files:
  created:
    - "apps/web/lib/medicoes-utils.ts"
    - "apps/web/lib/validations/medicoes.ts"
    - "apps/web/lib/actions/medicoes.ts"
    - "apps/api/src/pdf-templates/BoletimMedicao.tsx"
    - "apps/web/tests/lib/medicoes.test.ts"
    - "apps/web/tests/actions/medicoes.test.ts"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/MedicoesClient.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/fisica/[medicaoId]/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/fisica/[medicaoId]/MedicaoFisicaDetailClient.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/contrato/[medicaoId]/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/contrato/[medicaoId]/MedicaoContratoDetailClient.tsx"
    - "apps/web/components/medicoes/ProgressoGeral.tsx"
    - "apps/web/components/medicoes/MedicaoCard.tsx"
    - "apps/web/components/medicoes/MedicaoFisicaForm.tsx"
    - "apps/web/components/medicoes/MedicaoContratoForm.tsx"
  modified:
    - "apps/api/src/queues/pdf-generation.worker.ts"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx"
decisions:
  - "progressoGeral computed on demand via calcularProgressoPonderado — not stored in DB (MedicaoFisica schema has no progressoGeral column)"
  - "empreiteiroNome stored as empreiteiroId free-text field (schema); CNPJ stored in contrato field — adapting to actual schema not plan's proposed fields"
  - "approveMedicao restricted to ADMIN only — locked decision from Phase 4 context (ENGENHEIRO cannot approve)"
  - "MedicaoFisica PDF generation uploads to R2 but no pdfR2Key update (field not in schema for fisica)"
metrics:
  duration: 12 minutes
  completed: 2026-03-14T15:36:00Z
  tasks_completed: 2
  files_created: 16
  files_modified: 2
  tests_added: 17
---

# Phase 4 Plan 05: Medicoes (Measurements) Summary

**One-liner:** Physical and contract measurement workflow with Decimal.js weighted progress, ADMIN-only approval, cumulative acumulado history per empreiteiro, and async boletim PDF generation via BullMQ.

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-14T15:24:28Z
- **Completed:** 2026-03-14T15:36:00Z
- **Tasks:** 2 (TDD for Task 1: RED + GREEN)
- **Files:** 16 created, 2 modified

## Accomplishments

### Task 1: Server Actions + Utilities + PDF Template + Tests (TDD)

**calcularProgressoPonderado** (`lib/medicoes-utils.ts`):
- Input: `{ valorTotal: string | number, percentualExecutado: number }[]`
- Formula: `SUM(valorTotal * pct/100) / SUM(valorTotal) * 100`
- Decimal.js throughout to avoid float errors
- Returns `number` with 1 decimal (toFixed(1))
- Edge cases: empty array → 0, zero total → 0

**Validations** (`lib/validations/medicoes.ts`):
- `createMedicaoFisicaSchema`: obraId, orcamentoId, periodo (YYYY-MM regex)
- `updateMedicaoFisicaItemSchema`: medicaoFisicaItemId, percentualExecutado (0-100)
- `createMedicaoContratoSchema`: obraId, empreiteiroNome, empreiteiroCnpj (optional), periodo
- `addContratoItemSchema`: medicaoId, descricao, unidade, quantidade, valorUnitario

**Server Actions** (`lib/actions/medicoes.ts`):
- `createMedicaoFisica`: creates MedicaoFisica + MedicaoFisicaItem per OrcamentoItem (percentualMedido=0)
- `updateMedicaoFisicaItem`: updates percentage, recalculates weighted progressoGeral
- `getMedicaoFisica`: returns medicao with items + computed progressoGeral
- `listMedicoesFisicas`: all fisica ordered by periodo DESC + computed progressoGeral
- `createMedicaoContrato`: stores empreiteiroNome as empreiteiroId, CNPJ as contrato field
- `addContratoItem`: creates MedicaoContratoItem
- `getMedicaoContrato`: returns contrato + cumulative totals from prior periods (MED-02)
- `listMedicoesContrato`: all contrato ordered by periodo DESC + totalPeriodo
- `approveMedicao`: ADMIN only; sets APROVADA + aprovadoPor + aprovadoEm; emits notification
- `rejectMedicao`: ADMIN only; sets REJEITADA
- `exportBoletim`: calls addPdfJob with type "boletim-medicao"
- `getBoletimPdfUrl`: presigned S3 GET URL for MedicaoContrato.pdfR2Key

**BoletimMedicao.tsx** (react-pdf template):
- Header: empresa, obra, periodo, tipo, data, status
- Fisica: green progress box with percentage, items table (descricao/un/qtd orc/% exec/valor exec)
- Contrato: empreiteiro section, items table with acumulado column, totals section (periodo/anterior/geral)
- Approval section with status and signature line
- Footer with page numbers (fixed)

**pdf-generation.worker.ts**: implemented `boletim-medicao` case (was TODO placeholder since Plan 04-03):
- Tries MedicaoContrato first (has pdfR2Key field), updates pdfR2Key after upload
- Falls back to MedicaoFisica (no pdfR2Key storage — uploads to R2 for socket notification only)

**Tests** (17 new, 145 total pass):
- `tests/lib/medicoes.test.ts`: 8 unit tests for calcularProgressoPonderado (MED-01)
- `tests/actions/medicoes.test.ts`: 9 tests covering createMedicaoFisica, MED-02 accumulation, approveMedicao role checks, exportBoletim job enqueue

### Task 2: Medicoes UI Pages and Components

**medicoes/page.tsx** (Server Component) + **MedicoesClient.tsx** (Client):
- Lists MedicaoCard for both tipos ordered by periodo DESC
- ProgressoGeral at top (from latest fisica measurement)
- "Nova Medicao Fisica" (requires orcamento) and "Nova Medicao de Contrato" buttons
- Modal dialogs for MedicaoFisicaForm and MedicaoContratoForm

**ProgressoGeral.tsx**: color-coded bar + large % number (green >75%, yellow >50%, red <25%)

**MedicaoCard.tsx**: status badge (RASCUNHO/SUBMETIDA/APROVADA/REJEITADA), approve/reject inline buttons for ADMIN, links to detail page

**MedicaoFisicaDetailClient.tsx**:
- Range sliders (0-100) per OrcamentoItem row
- Live progressoGeral update on slider release (calls updateMedicaoFisicaItem)
- Approve/Reject/Exportar Boletim buttons

**MedicaoContratoDetailClient.tsx**:
- Empreiteiro info header
- Inline "Adicionar Item" form (descricao/unidade/quantidade/valorUnitario)
- Items table with valor executado and acumulado columns
- Resumo Acumulado section (anterior + periodo + geral)
- Baixar PDF button (getBoletimPdfUrl presigned)

**ObraDetailClient.tsx**: "Medicoes" Link tab added after "Estoque"

## Task Commits

1. **TDD RED: Failing tests** — `2eace87` (test)
2. **Task 1: Implementation** — `8f005ee` (feat)
3. **Task 2: UI** — `f8ba682` (feat)

## Deviations from Plan

### Auto-fixed Issues (Schema Adaptation)

**1. [Rule 1 - Bug] Plan field names don't match actual Prisma schema**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `percentualExecutado` but schema has `percentualMedido`. Plan specified `empreiteiroNome`/`empreiteiroCnpj` as separate fields but schema has single `empreiteiroId` (free-text) and `contrato` field. Plan specified `progressoGeral` stored field but schema has no such column on MedicaoFisica. Plan specified `quantidadeContratada`/`quantidadeExecutada` but schema has single `quantidade`.
- **Fix:** Adapted all actions and tests to use actual schema field names. `empreiteiroNome` → stored in `empreiteiroId`; `empreiteiroCnpj` → stored in `contrato`; `progressoGeral` → computed on demand via `calcularProgressoPonderado`.
- **Files modified:** `lib/actions/medicoes.ts`, `lib/validations/medicoes.ts`, `tests/actions/medicoes.test.ts`
- **Commit:** 8f005ee

**2. [Rule 1 - Bug] MedicaoFisica has no pdfR2Key field**
- **Found during:** Worker implementation
- **Issue:** Schema does not have `pdfR2Key` on `MedicaoFisica` (only on `MedicaoContrato`). The worker cannot update pdfR2Key for fisica boletims.
- **Fix:** Worker uploads fisica PDF to R2 (for socket notification) but does not attempt to update any DB field. Only MedicaoContrato PDF gets pdfR2Key stored and can be downloaded via `getBoletimPdfUrl`.
- **Files modified:** `pdf-generation.worker.ts`
- **Commit:** 8f005ee

## Success Criteria Verification

- MED-01: `calcularProgressoPonderado` returns weighted average by valorTotal using Decimal.js. 8 unit tests pass. `getMedicaoFisica` and `listMedicoesFisicas` compute and return progressoGeral on demand.
- MED-02: `getMedicaoContrato` fetches all prior period medicoes for same `empreiteiroId` + `obraId` and returns `totalAcumuladoAnterior`, `totalPeriodo`, `totalAcumulado`. Contrato detail page displays acumulado section.

## Self-Check: PASSED
