---
phase: 04-orcamento-compras-medicoes
plan: 01
subsystem: orcamento
tags: [prisma, schema, tsvector, server-actions, ui, tdd]
dependency_graph:
  requires: []
  provides: [orcamento-schema, sinapi-search, orcamento-crud, bdi-config, import-xlsx, orcamento-ui]
  affects: [04-02, 04-03, 04-05]
tech_stack:
  added: [xlsx@0.20.3-from-cdn]
  patterns: [tsvector-full-text-search, decimal-financial-values, server-actions-zod-revalidate, custo-venda-bdi-toggle]
key_files:
  created:
    - packages/db/prisma/migrations/00000000000005_phase4_models/migration.sql
    - apps/web/lib/orcamento.ts
    - apps/web/lib/orcamento-utils.ts
    - apps/web/lib/validations/orcamento.ts
    - apps/web/lib/actions/orcamento.ts
    - apps/web/app/(dashboard)/dashboard/obras/[id]/orcamento/page.tsx
    - apps/web/components/orcamento/BdiConfig.tsx
    - apps/web/components/orcamento/EtapaForm.tsx
    - apps/web/components/orcamento/ImportModal.tsx
    - apps/web/components/orcamento/ItemForm.tsx
    - apps/web/components/orcamento/OrcamentoTable.tsx
    - apps/web/components/orcamento/SinapiSearch.tsx
    - scripts/seed-sinapi.ts
    - apps/web/tests/lib/orcamento.test.ts
    - apps/web/tests/actions/orcamento.test.ts
  modified:
    - packages/db/prisma/schema.prisma
    - apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx
    - apps/web/package.json
    - pnpm-lock.yaml
decisions:
  - "SheetJS installed from CDN (xlsx-0.20.3.tgz) not npm registry to avoid CVE risk"
  - "precoVenda never stored in DB — always derived as custoTotal * (1 + bdi/100) at render time"
  - "BDI applied globally at Orcamento level, not per item"
  - "buildCurvaABC implemented as pure function: A<=50%, B<=80%, C>80% cumulative"
  - "SinapiComposicao uses GENERATED ALWAYS AS tsvector with plainto_tsquery portuguese"
metrics:
  duration: 11 minutes
  completed: 2026-03-14T14:52:00Z
  tasks_completed: 2
  files_created: 15
  files_modified: 4
  tests_added: 22
---

# Phase 4 Plan 01: Orcamento Foundation Summary

**One-liner:** Obra budget system with SINAPI tsvector search, 2-level Etapa > Item hierarchy, global BDI Custo/Venda toggle, XLSX import via SheetJS CDN, and all Phase 4 Prisma models.

## What Was Built

### Task 1: Prisma Schema + SINAPI Migration + Server Actions + Tests (TDD)

**Prisma schema additions:**
- 15 new models: Orcamento, OrcamentoEtapa, OrcamentoItem, SinapiComposicao, Fornecedor, CompraRequisicao, CompraCotacao, CompraPedido, CompraPedidoItem, Deposito, MovimentacaoEstoque, MedicaoFisica, MedicaoFisicaItem, MedicaoContrato, MedicaoContratoItem
- 4 new enums: RequisicaoStatus, PedidoStatus, MovimentacaoTipo, MedicaoStatus
- All financial values use Decimal(12,4); BDI uses Decimal(5,2)
- Relation fields added to Obra (orcamento, requisicoes, pedidos, depositos, medicoesFisicas, medicoesContrato) and Empresa (fornecedores)

**Migration file** (`00000000000005_phase4_models/migration.sql`):
- ALTER TABLE to add GENERATED ALWAYS AS tsvector on SinapiComposicao
- GIN index for fast full-text search
- RLS policies (SELECT/INSERT/UPDATE/DELETE) for all 14 Phase 4 tables using `app.current_tenant_id` pattern
- SinapiComposicao uses public SELECT (read-only for all tenants)

**Server actions** (`lib/actions/orcamento.ts`):
- `searchSinapi(query, estado)`: empty query guard, plainto_tsquery portuguese, ts_rank ordering, LIMIT 20
- `createOrcamento(obraId)`: default BDI 0, @unique enforces one orcamento per obra
- `createEtapa/deleteEtapa`: deleteEtapa refuses if items exist (same pattern as cronograma)
- `createItem/updateItem/deleteItem`: Decimal values for quantidade and custoUnitario
- `updateBdi(orcamentoId, bdi)`: Zod validates 0-100 range
- `getOrcamento(obraId)`: returns full hierarchy ordered by etapa.ordem
- `importFromSheet(formData)`: SheetJS CDN parse, column detection (Descricao/Unidade/Quantidade/Custo Unitario), bulk createMany

**Pure utilities:**
- `lib/orcamento.ts` — `calcularPrecoVenda(custo, bdi)`
- `lib/orcamento-utils.ts` — `buildCurvaABC(items)` with A/B/C classification

**Seed script** (`scripts/seed-sinapi.ts`): Auto-detects SINAPI Excel columns, upsert by codigo, batch progress output, --dry-run mode.

### Task 2: Orcamento UI Page and Components

**Page** (`/dashboard/obras/[id]/orcamento`):
- Server Component fetching orcamento with etapas and items
- Empty state with "Criar Orcamento" server action button
- Header with BdiConfig and OrcamentoTable when orcamento exists

**OrcamentoTable:**
- Collapsible Etapa header rows with item count
- Item rows with descricao, unidade, quantidade, custo unitario, total
- Custo/Venda toggle: switches column labels and multiplies values by (1 + bdi/100)
- Grand total footer row
- Add Etapa / Add Item / Importar / Excluir buttons per etapa
- Modal dialogs for EtapaForm, ItemForm, ImportModal

**BdiConfig:** BDI percentage input with 0-100 validation, save with useTransition, success feedback.

**SinapiSearch:** 300ms debounced input, dropdown with codigo/descricao/unidade/preco, auto-fills ItemForm.

**EtapaForm/ItemForm/ImportModal:** Modal forms with error handling, loading states, server action calls.

**ObraDetailClient:** "Orcamento" Link tab added after "Diario de Obra".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] Added buildCurvaABC utility function**
- **Found during:** Task 2 - test file was modified to include buildCurvaABC tests
- **Issue:** Tests referenced `@/lib/orcamento-utils` with `buildCurvaABC` function that did not exist
- **Fix:** Created `lib/orcamento-utils.ts` with `buildCurvaABC` implementing A<=50%, B<=80%, C>80% cumulative classification
- **Files modified:** `apps/web/lib/orcamento-utils.ts` (new), `apps/web/tests/lib/orcamento.test.ts` (updated)
- **Commit:** 82f51f1

**2. [Rule 3 - Blocking] SQL migration gitignore conflict**
- **Found during:** Task 1 commit
- **Issue:** `.gitignore` ignores `packages/db/prisma/migrations/*.sql` (standalone SQL files); existing migrations use directory structure
- **Fix:** Moved `sinapi_tsvector.sql` to `00000000000005_phase4_models/migration.sql` matching existing migration folder pattern
- **Files modified:** Migration folder created and SQL moved

## Success Criteria Verification

- ORC-01: `searchSinapi` uses `plainto_tsquery('portuguese', query)` on `searchVec` tsvector, orders by `ts_rank`, LIMIT 20. Empty query guard returns `[]`.
- ORC-02: `OrcamentoEtapa > OrcamentoItem` hierarchy with `quantidade Decimal(12,4)`, `custoUnitario Decimal(12,4)`, `unidade String`.
- ORC-03: `bdi Decimal(5,2)` on Orcamento. Venda view: `OrcamentoTable` multiplies totals by `(1 + bdi/100)` at render time, never stored.
- ORC-04: `importFromSheet` uses SheetJS (CDN install `xlsx-0.20.3.tgz`), maps columns, `createMany` bulk insert.

## Self-Check: PASSED

All required files verified to exist:
- FOUND: apps/web/lib/actions/orcamento.ts
- FOUND: apps/web/lib/orcamento.ts
- FOUND: apps/web/lib/orcamento-utils.ts
- FOUND: apps/web/lib/validations/orcamento.ts
- FOUND: apps/web/app/(dashboard)/dashboard/obras/[id]/orcamento/page.tsx
- FOUND: apps/web/components/orcamento/OrcamentoTable.tsx
- FOUND: packages/db/prisma/migrations/00000000000005_phase4_models/migration.sql
- FOUND: scripts/seed-sinapi.ts

Commits verified:
- 6d8ade9 feat(04-01): Prisma schema + SINAPI tsvector migration + server actions + tests
- 82f51f1 feat(04-01): Orcamento UI page and components

Tests: 105 passed (0 failed)
Build: Next.js build succeeds with /dashboard/obras/[id]/orcamento in output
