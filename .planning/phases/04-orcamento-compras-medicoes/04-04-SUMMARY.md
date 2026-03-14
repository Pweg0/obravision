---
phase: 04-orcamento-compras-medicoes
plan: 04
subsystem: estoque
tags: [server-actions, tdd, prisma-transaction, estoque, deposito, movimentacao, notifications]
dependency_graph:
  requires:
    - phase: 04-01
      provides: "Prisma schema with Deposito, MovimentacaoEstoque, CompraPedido, CompraPedidoItem models"
    - phase: 04-03
      provides: "CompraPedido workflow, compras.ts actions, notification.ts emitNotification"
  provides:
    - "deliverPedido: atomic $transaction marks pedido ENTREGUE + creates ENTRADA per item (COMP-05)"
    - "addMovimentacao: SAIDA prevents negative stock via $transaction saldo check"
    - "addMovimentacao: TRANSFERENCIA atomic SAIDA+ENTRADA across depositos"
    - "checkLowStock: emits estoque-baixo notification to ADMIN+ENGENHEIRO"
    - "Estoque page at /dashboard/obras/[id]/estoque with deposito selector and stock table"
    - "createDeposito and listDepositos: obra-scoped deposito CRUD"
    - "getEstoqueAtual: net balance per material per deposito (ENTRADA - SAIDA)"
    - "getEstoqueResumo: cross-deposito summary with low stock flags"
  affects:
    - "04-03-compras: CompraPedido.status=ENTREGUE now set by deliverPedido"
    - "04-05-medicoes: MedicaoContratoDetailClient stub created for build compatibility"
tech_stack:
  added: []
  patterns:
    - "prisma.$transaction for atomic SAIDA stock check: query movimentacoes + verify saldo >= quantidade + create SAIDA"
    - "quantidadeMinima stored as etapaDestino metadata: 'min:{value}' on ENTRADA records"
    - "deliverPedido auto-creates default deposito if none exists for the obra"
    - "z.input<typeof schema> for Zod input types with defaults (not z.infer which gives output type)"
key_files:
  created:
    - "apps/web/lib/validations/estoque.ts"
    - "apps/web/lib/actions/estoque.ts"
    - "apps/web/tests/actions/estoque.test.ts"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/estoque/page.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/estoque/EstoqueClient.tsx"
    - "apps/web/components/estoque/EstoqueTable.tsx"
    - "apps/web/components/estoque/DepositoSelector.tsx"
    - "apps/web/components/estoque/MovimentacaoForm.tsx"
    - "apps/web/components/estoque/EstoqueAlerts.tsx"
  modified:
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx"
    - "apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/contrato/[medicaoId]/MedicaoContratoDetailClient.tsx"
decisions:
  - "quantidadeMinima not in Prisma schema — stored as etapaDestino metadata 'min:{value}' on ENTRADA records to avoid schema migration"
  - "deliverPedido sets CompraRequisicao.status=APROVADA not ENTREGUE — RequisicaoStatus enum has no ENTREGUE value"
  - "z.input<typeof createDepositoSchema> used for CreateDepositoInput — z.infer gives output type with tipo required, z.input keeps optional fields optional"
metrics:
  duration: 14 minutes
  completed: 2026-03-14T15:38:44Z
  tasks_completed: 2
  files_created: 9
  files_modified: 2
  tests_added: 4
---

# Phase 4 Plan 04: Estoque (Inventory Control) Summary

**Inventory control with multiple depositos per obra, 3 movement types (ENTRADA/SAIDA/TRANSFERENCIA) with atomic stock checks, automatic inventory entry when purchase orders are delivered, and real-time low stock notifications.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-03-14T15:24:24Z
- **Completed:** 2026-03-14T15:38:44Z
- **Tasks:** 2 (TDD for Task 1: RED + GREEN)
- **Files:** 9 created, 2 modified

## Accomplishments

### Task 1: Estoque Server Actions + deliverPedido + checkLowStock (TDD)

**Validations** (`lib/validations/estoque.ts`):
- `createDepositoSchema`: obraId, nome, tipo (optional, defaults "almoxarifado")
- `addMovimentacaoSchema`: depositoId, tipo, descricao, unidade, quantidade, quantidadeMinima (optional), depositoDestinoId (required for TRANSFERENCIA), pedidoId, tarefaId, etapaId, observacoes — with .refine() enforcing depositoDestinoId for TRANSFERENCIA

**Estoque actions** (`lib/actions/estoque.ts`):
- `createDeposito`: creates Deposito scoped to obraId + tenantId
- `listDepositos(obraId)`: returns all depositos ordered by createdAt asc
- `addMovimentacao(data)`:
  - ENTRADA: stores quantidadeMinima in `etapaDestino` metadata as `"min:{value}"`
  - SAIDA: `prisma.$transaction` queries movimentacoes, calculates saldo, rejects with `{error: "Estoque insuficiente"}` if saldo < quantidade, then creates SAIDA
  - TRANSFERENCIA: `prisma.$transaction` checks source saldo, creates SAIDA on source + ENTRADA on destination atomically
  - After SAIDA/TRANSFERENCIA: calls `checkLowStock`
- `getEstoqueAtual(depositoId)`: aggregates movimentacoes by descricao, net saldo, reads quantidadeMinima from etapaDestino metadata
- `getEstoqueResumo(obraId)`: per-deposito summary with lowStock flag
- `deliverPedido(pedidoId)`: `prisma.$transaction` — (1) update CompraPedido to ENTREGUE, (2) update linked requisicoes to APROVADA, (3) create ENTRADA per pedido item. Auto-creates default deposito if none exists
- `checkLowStock(depositoId, descricao)`: calculates saldo, reads minima from etapaDestino, emits `estoque-baixo` notification to ADMIN+ENGENHEIRO via `emitNotification`

**Tests** (4 new, 145 total pass):
- `deliverPedido creates ENTRADA movimentacao (COMP-05)`
- `deliverPedido returns error when pedido is already ENTREGUE`
- `addMovimentacao SAIDA with insufficient stock returns {error: "Estoque insuficiente"}`
- `addMovimentacao SAIDA allows when sufficient stock`

### Task 2: Estoque UI Pages and Components

**estoque/page.tsx** (Server Component):
- Fetches listDepositos + getEstoqueAtual for selected deposito (from query param or first)
- Renders EstoqueClient with data

**EstoqueClient.tsx** (Client Component):
- Deposito selector + stock table + low stock alerts
- "Registrar Movimentacao" button opens MovimentacaoForm modal
- On deposito select: navigates to `?deposito={id}` for server refetch

**DepositoSelector.tsx** (Client Component):
- Inline deposito switcher (pill buttons per deposito)
- "+ Novo Deposito" expands inline form calling `createDeposito`
- Auto-selects new deposito after creation

**EstoqueTable.tsx** (Client Component):
- Columns: Material, Unidade, Saldo Atual, Minimo, Status
- Status badges: Normal (green), Baixo (yellow when saldo < 2x minimo), Critico (red when saldo < minimo)
- Empty state: "Nenhum material em estoque neste deposito"

**MovimentacaoForm.tsx** (Client Component):
- Modal with tipo dropdown (ENTRADA/SAIDA/TRANSFERENCIA)
- `quantidadeMinima` field shown only for ENTRADA
- `depositoDestinoId` selector shown only for TRANSFERENCIA
- Error display for "Estoque insuficiente"

**EstoqueAlerts.tsx** (Client Component):
- Shows low stock materials as red alert cards (descricao, saldo atual, minimo)
- Socket listener on `estoque-baixo` event for real-time updates

**ObraDetailClient.tsx**: "Estoque" tab added after "Compras"

## Task Commits

1. **TDD RED: Failing tests** - `8d2523c` (test)
2. **Task 1: Implementation** - `f27f9ac` (feat)
3. **Task 2: UI** - `6567f4c` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RequisicaoStatus enum has no ENTREGUE value**
- **Found during:** Task 1 implementation + build validation
- **Issue:** Plan described updating CompraRequisicao status to ENTREGUE when pedido is delivered. Prisma `RequisicaoStatus` enum has: RASCUNHO, PENDENTE, APROVADA, REJEITADA, CANCELADA — no ENTREGUE.
- **Fix:** Changed `deliverPedido` to update requisicao status to `APROVADA` (fulfilled state) instead of ENTREGUE.
- **Files modified:** `apps/web/lib/actions/estoque.ts`
- **Commit:** f27f9ac / 6567f4c

**2. [Rule 1 - Bug] z.infer on schema with default gives required tipo in TypeScript output type**
- **Found during:** Task 2 build
- **Issue:** `CreateDepositoInput = z.infer<typeof createDepositoSchema>` produces `{obraId, nome, tipo: string}` (all required), but `DepositoSelector` calls `createDeposito({ obraId, nome })` without `tipo`. TypeScript rejected the call.
- **Fix:** Changed to `z.input<typeof createDepositoSchema>` which preserves optional fields as optional in the input type.
- **Files modified:** `apps/web/lib/validations/estoque.ts`
- **Commit:** 6567f4c

**3. [Rule 3 - Blocking] Missing MedicaoContratoDetailClient blocking build**
- **Found during:** Task 2 build
- **Issue:** Pre-existing `medicoes/contrato/[medicaoId]/page.tsx` (from plan 04-05 scaffolding) imported `MedicaoContratoDetailClient` which didn't exist, causing build failure.
- **Fix:** Created stub `MedicaoContratoDetailClient.tsx`. The linter then replaced the stub with a fuller implementation based on the medicoes plan patterns.
- **Files modified:** `apps/web/app/(dashboard)/dashboard/obras/[id]/medicoes/contrato/[medicaoId]/MedicaoContratoDetailClient.tsx`
- **Commit:** 6567f4c

**4. Design decision: quantidadeMinima stored as etapaDestino metadata**
- **Rationale:** Prisma `MovimentacaoEstoque` schema has no `quantidadeMinima` column. Adding a new DB column requires a migration (Rule 4 territory). Workaround: encode as `"min:{value}"` in the existing `etapaDestino` string field on ENTRADA records. This is readable by `getEstoqueAtual` and `checkLowStock` without schema changes.

## Success Criteria Verification

- **COMP-05:** `deliverPedido` wraps `prisma.$transaction` to atomically update pedido status + create `ENTRADA` MovimentacaoEstoque per item. Test: "creates ENTRADA movimentacao when pedido is delivered (COMP-05)" passes.
- **Depositos per obra with CRUD:** `createDeposito` + `listDepositos` implemented, `DepositoSelector` creates inline.
- **3 movement types:** ENTRADA (direct), SAIDA (stock check in transaction), TRANSFERENCIA (atomic dual-record transaction) all implemented.
- **Low stock alerts:** `checkLowStock` emits `estoque-baixo` via `emitNotification` to ADMIN+ENGENHEIRO. `EstoqueAlerts` listens for socket event.
- **Build:** Next.js build succeeds, `/dashboard/obras/[id]/estoque` route in output.
- **Tests:** 4 estoque tests pass, 145 total.

## Self-Check: PASSED

Files verified to exist:
- FOUND: apps/web/lib/actions/estoque.ts
- FOUND: apps/web/lib/validations/estoque.ts
- FOUND: apps/web/tests/actions/estoque.test.ts
- FOUND: apps/web/app/(dashboard)/dashboard/obras/[id]/estoque/page.tsx
- FOUND: apps/web/components/estoque/EstoqueTable.tsx
- FOUND: apps/web/components/estoque/DepositoSelector.tsx
- FOUND: apps/web/components/estoque/MovimentacaoForm.tsx
- FOUND: apps/web/components/estoque/EstoqueAlerts.tsx

Commits verified:
- 8d2523c test(04-04): add failing tests for estoque deliverPedido and addMovimentacao
- f27f9ac feat(04-04): estoque server actions - deliverPedido + addMovimentacao + checkLowStock
- 6567f4c feat(04-04): estoque UI page and components

Tests: 145 passed (4 new estoque tests)
Build: Next.js build succeeds, /dashboard/obras/[id]/estoque in output
