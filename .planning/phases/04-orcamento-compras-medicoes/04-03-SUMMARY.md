---
phase: 04-orcamento-compras-medicoes
plan: 03
subsystem: compras
tags: [server-actions, tdd, react-pdf, bullmq, r2, mapa-comparativo, fornecedor, requisicao]
dependency_graph:
  requires:
    - phase: 04-01
      provides: "Prisma schema with CompraRequisicao, CompraCotacao, CompraPedido, Fornecedor models"
    - phase: 04-02
      provides: "pdf-generation.worker.ts with BullMQ + R2 + socket pattern, pdf-generation.queue.ts"
  provides:
    - "buildMapa pure function: items x fornecedores matrix with menorPreco highlighting"
    - "createRequisicao server action: links orcamentoItemId, emits notification to ADMINs"
    - "approveRequisicao: ADMIN/ENGENHEIRO only, emits notification to requester"
    - "createPedido: creates CompraPedido, enqueues pedido-compra PDF job to BullMQ"
    - "createFornecedor: scoped to empresaId, reusable across all obras"
    - "Compras page at /dashboard/obras/[id]/compras with status filter tabs"
    - "Requisicao detail at /dashboard/obras/[id]/compras/[requisicaoId] with mapa comparativo"
    - "Fornecedores page at /dashboard/fornecedores (empresa-level CRUD)"
    - "PedidoCompra.tsx react-pdf template"
  affects:
    - "04-04-estoque: CompraPedido when status=ENTREGUE should auto-create estoque entry"
    - "04-05-medicoes: pdf-generation.worker.ts still has TODO for boletim-medicao"
tech_stack:
  added: []
  patterns:
    - "buildMapa pure function: O(n*m) items x cotacoes, single pass per row to find menorPreco"
    - "Server action role check pattern: requireAdminOrEngenheiro() returns {error} or null"
    - "TDD red-green: test files committed first, implementation committed after tests pass"
    - "Decimal type handling: use any for Prisma Decimal in React component interfaces"
    - "pdf-queue-client.ts: thin HTTP client wrapping fetch to API /pdf/enqueue"
key_files:
  created:
    - "apps/web/lib/validations/compras.ts"
    - "apps/web/lib/compras-utils.ts"
    - "apps/web/lib/pdf-queue-client.ts"
    - "apps/web/lib/actions/compras.ts"
    - "apps/web/lib/actions/fornecedor.ts"
    - "apps/api/src/pdf-templates/PedidoCompra.tsx"
    - "apps/web/tests/lib/compras.test.ts"
    - "apps/web/tests/actions/compras.test.ts"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/compras/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/compras/ComprasClient.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/compras/[requisicaoId]/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/compras/[requisicaoId]/RequisicaoDetailClient.tsx"
    - "apps/web/components/compras/RequisicaoForm.tsx"
    - "apps/web/components/compras/RequisicaoCard.tsx"
    - "apps/web/components/compras/CotacaoForm.tsx"
    - "apps/web/components/compras/MapaComparativo.tsx"
    - "apps/web/components/compras/PedidoCard.tsx"
    - "apps/web/components/compras/FornecedorForm.tsx"
    - "apps/web/components/compras/FornecedorSelect.tsx"
    - "apps/web/app/(dashboard)/dashboard/fornecedores/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/fornecedores/FornecedoresClient.tsx"
  modified:
    - "apps/api/src/queues/pdf-generation.worker.ts"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx"
decisions:
  - "pdf-queue-client.ts wraps BullMQ enqueue via HTTP to API instead of importing BullMQ directly in web app — consistent with enqueueProposta pattern in orcamento-pdf.ts"
  - "buildMapa uses single pass per row (O(n*m) total) — simpler than pre-building fornecedor index, acceptable for typical data sizes"
  - "Decimal fields in React component interfaces use any — avoids prisma Decimal import in UI code, strings rendered via parseFloat(String(val))"
  - "MapaComparativo triggers createPedido directly — avoids a separate PedidoForm step for the common case of selecting from comparison table"
metrics:
  duration: 17 minutes
  completed: 2026-03-14T15:20:59Z
  tasks_completed: 2
  files_created: 21
  files_modified: 2
  tests_added: 19
---

# Phase 4 Plan 03: Compras (Procurement) Summary

**Complete procurement workflow: purchase requisitions linked to budget items, ADMIN/ENGENHEIRO approval with notifications, supplier quotes with side-by-side mapa comparativo highlighting lowest price, purchase orders with BullMQ async PDF generation, and empresa-scoped supplier management.**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-03-14T15:03:39Z
- **Completed:** 2026-03-14T15:20:59Z
- **Tasks:** 2 (TDD for Task 1: RED + GREEN)
- **Files:** 21 created, 2 modified

## Accomplishments

### Task 1: Server Actions + Fornecedor CRUD + buildMapa + Tests (TDD)

**Validations** (`lib/validations/compras.ts`):
- `createRequisicaoSchema`: obraId, orcamentoItemId (optional), descricao, quantidade, unidade, urgente, observacoes
- `addCotacaoSchema`: requisicaoId, fornecedorId, precoUnitario, prazoEntrega, observacoes
- `createPedidoSchema`: obraId, fornecedorId, itens[], observacoes
- `createFornecedorSchema`: nome, cnpj (14-digit validation), contato, email, telefone, categorias

**buildMapa** (`lib/compras-utils.ts`):
- Input: `MapaRequisicaoItem[]` + `MapaCotacao[]`
- Output: `MapaRow[]` with `precos: Record<fornecedorId, preco>`, `menorPreco`, `melhorFornecedorId`
- Handles Decimal string inputs via `parseFloat(String(val))`

**Fornecedor actions** (`lib/actions/fornecedor.ts`):
- `createFornecedor`: scoped to `empresa.id` (NOT obraId) — enforces reusability across obras
- `listFornecedores`, `updateFornecedor`, `deleteFornecedor`: guards against existing cotacoes/pedidos

**Compras actions** (`lib/actions/compras.ts`):
- `createRequisicao`: status=PENDENTE, links orcamentoItemId, emits notification to ADMIN members
- `approveRequisicao`: ADMIN/ENGENHEIRO only, sets aprovadoEm, emits notification to requester
- `rejectRequisicao`: status=CANCELADA
- `addCotacao`: checks for duplicate (requisicao + fornecedor), creates CompraCotacao
- `createPedido`: creates CompraPedido with computed totalEstimado, enqueues pedido-compra PDF job
- `getPedidoPdfUrl`: presigned S3 GET URL with 1hr expiry
- `getCompradoVsOrcado`: sums PENDENTE+APROVADA requisicao quantities for a given orcamento item

**PedidoCompra.tsx** (react-pdf template):
- Header: empresa name, obra name, pedido number, date
- Supplier section: nome, CNPJ, contato, email, telefone
- Items table: alternating rows, descricao/unidade/qtd/precoUnit/total columns
- Grand total with BRL formatting
- Footer with page numbers (fixed)

**pdf-generation.worker.ts update**: Implements `pedido-compra` handler that was a TODO placeholder — fetches CompraPedido with itens + fornecedor + obra, renders template, uploads to R2, updates `pdfR2Key`.

**Tests** (19 new, 124 total pass):
- `tests/lib/compras.test.ts`: buildMapa with 2 suppliers, empty cotacoes, single supplier, Decimal string inputs
- `tests/actions/compras.test.ts`: createRequisicao links orcamentoItemId, approveRequisicao role checks, createPedido enqueues PDF job, createFornecedor uses empresaId

### Task 2: Compras UI Pages and Components

**compras/page.tsx** (Server Component) + **ComprasClient.tsx** (Client):
- Fetches requisicoes via server action, passes to client
- Status filter tabs: Todas / Pendentes / Aprovadas / Canceladas with badge counts
- "Nova Requisicao" button opens modal

**RequisicaoForm.tsx**: Optional orcamento item dropdown that auto-fills descricao/unidade, quantidade, unidade, urgente toggle, observacoes

**RequisicaoCard.tsx**: Status badge with REQUISICAO_STATUS_CONFIG colors, approve/reject inline buttons for ADMIN/ENGENHEIRO, link to detail page

**compras/[requisicaoId]/page.tsx** + **RequisicaoDetailClient.tsx**:
- Requisicao header card with status, budget item link, approve/reject buttons
- Cotacoes list with preco/prazo/subtotal per item
- MapaComparativo shown when 2+ suppliers have quotes

**MapaComparativo.tsx**:
- Derives unique suppliers from cotacoes
- Builds mapa rows via `buildMapa()`
- Green highlight on lowest price cell per row
- Total row per supplier column
- "Selecionar" button calls `createPedido` directly for the selected supplier

**CotacaoForm.tsx**: FornecedorSelect + precoUnitario + prazoEntrega + observacoes

**PedidoCard.tsx**: Status badge, total, items table, PDF download with presigned URL via `getPedidoPdfUrl`

**FornecedorForm.tsx**: Full form with categorias multi-select toggle pills

**FornecedorSelect.tsx**: Dropdown + inline "Novo" that opens FornecedorForm without leaving the modal

**fornecedores/page.tsx** + **FornecedoresClient.tsx**: Table with all empresa suppliers, delete with guard against cotacoes/pedidos

**ObraDetailClient.tsx**: "Compras" tab added after "Orcamento"

## Task Commits

1. **TDD RED: Failing tests** - `6b16697` (test)
2. **Task 1: Implementation** - `4aa541b` (feat)
3. **Task 2: UI** - `62c3c05` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] Created pdf-queue-client.ts as HTTP wrapper**
- **Found during:** Task 1 implementation
- **Issue:** Tests needed to mock the PDF job enqueue. Direct BullMQ import in the web app would require importing the full BullMQ + Redis dependency in tests. The existing pattern in `orcamento-pdf.ts` uses HTTP POST to API, but that is server action code, not mockable via a module mock.
- **Fix:** Created `lib/pdf-queue-client.ts` as a standalone module that can be mocked in tests. Compras action imports from this module. Tests mock `@/lib/pdf-queue-client`.
- **Files:** `apps/web/lib/pdf-queue-client.ts` (new)
- **Commit:** 4aa541b

**2. [Rule 1 - Bug] Prisma Decimal type incompatible with string | number in component interfaces**
- **Found during:** Task 2 build
- **Issue:** Prisma's `Decimal` type is not assignable to `string | number` in TypeScript strict mode. Component prop interfaces used `string | number` for financial amounts but received `Decimal` objects from server actions.
- **Fix:** Changed affected component prop interfaces to use `any` for Decimal fields (cantidad, precoUnitario, custoUnitario). Values rendered via `parseFloat(String(val))` — consistent with existing pattern in the codebase.
- **Files:** `RequisicaoCard.tsx`, `RequisicaoDetailClient.tsx`
- **Commit:** 62c3c05 (part of Task 2)

**3. [Rule 1 - Bug] FornecedorForm onSuccess type incompatibility**
- **Found during:** Task 2 build
- **Issue:** `FornecedoresClient`'s local `Fornecedor` interface had `createdAt: Date | string` (required), but `FornecedorForm`'s prop type used `createdAt?: Date | string` (optional). TypeScript rejected the callback assignment.
- **Fix:** Changed `FornecedorForm`'s `Fornecedor` type to `Record<string, any> & { id, nome, ... }` to be structurally compatible with any superset type.
- **Files:** `FornecedorForm.tsx`, `FornecedoresClient.tsx`
- **Commit:** 62c3c05

**4. [Rule 1 - Bug] CotacaoForm setError called with undefined**
- **Found during:** Task 2 build
- **Issue:** `result.error` from server action could be `string | undefined`, but `setError` expected `string | null`.
- **Fix:** Added `?? "Erro desconhecido"` fallback.
- **Files:** `CotacaoForm.tsx`
- **Commit:** 62c3c05

## Success Criteria Verification

- COMP-01: `createRequisicao` accepts `orcamentoItemId` (optional), stores it as FK to `OrcamentoItem`. `getCompradoVsOrcado` sums quantities. Test in `compras.test.ts`: "links orcamentoItemId when provided".
- COMP-02: `approveRequisicao` calls `requireAdminOrEngenheiro()` and returns `{error}` for CLIENTE. Test: "CLIENTE cannot approve — returns error".
- COMP-03: `buildMapa` returns matrix with `menorPreco`/`melhorFornecedorId` per row. `MapaComparativo.tsx` renders green cells. 8 unit tests in `compras.test.ts`.
- COMP-04: `createPedido` calls `addPdfJob({ type: "pedido-compra", entityId: pedido.id, ... })`. Test: "enqueues a pedido-compra PDF job". Worker `generatePedidoCompra` implemented and handles the job.
- COMP-06: `createFornecedor` sets `empresaId: empresa.id` with no `obraId`. Test: "scopes fornecedor to empresaId", "does not include obraId".

## Self-Check: PASSED

Files verified to exist:
- FOUND: apps/web/lib/actions/compras.ts
- FOUND: apps/web/lib/actions/fornecedor.ts
- FOUND: apps/web/lib/compras-utils.ts
- FOUND: apps/web/lib/validations/compras.ts
- FOUND: apps/web/lib/pdf-queue-client.ts
- FOUND: apps/api/src/pdf-templates/PedidoCompra.tsx
- FOUND: apps/web/components/compras/MapaComparativo.tsx
- FOUND: apps/web/app/(dashboard)/dashboard/obras/[id]/compras/page.tsx
- FOUND: apps/web/app/(dashboard)/dashboard/fornecedores/page.tsx

Commits verified:
- 6b16697 test(04-03): failing tests for compras
- 4aa541b feat(04-03): compras server actions + buildMapa + PedidoCompra template
- 62c3c05 feat(04-03): compras UI pages and components

Tests: 124 passed (19 new compras tests)
Build: Next.js build succeeds, all 3 new routes in output
