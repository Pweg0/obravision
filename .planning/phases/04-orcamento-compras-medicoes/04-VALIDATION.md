---
phase: 4
slug: orcamento-compras-medicoes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^2.1.9 |
| **Config file** | `apps/web/vitest.config.ts` (exists) |
| **Quick run command** | `pnpm --filter web test -- --reporter=dot` |
| **Full suite command** | `pnpm --filter web test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter web test -- --reporter=dot`
- **After every plan wave:** Run `pnpm --filter web test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ORC-01 | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "sinapi"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | ORC-02 | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "createItem"` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | ORC-03 | unit | `pnpm --filter web test -- tests/lib/orcamento.test.ts -t "bdi"` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | ORC-04 | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "import"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | ORC-05 | unit | `pnpm --filter web test -- tests/lib/orcamento.test.ts -t "curva"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | ORC-06 | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "pdf"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | COMP-01 | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "createRequisicao"` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | COMP-02 | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "approve"` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | COMP-03 | unit | `pnpm --filter web test -- tests/lib/compras.test.ts -t "mapa"` | ❌ W0 | ⬜ pending |
| 04-03-04 | 03 | 2 | COMP-04 | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "pedido"` | ❌ W0 | ⬜ pending |
| 04-03-05 | 03 | 2 | COMP-05 | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "deliver"` | ❌ W0 | ⬜ pending |
| 04-03-06 | 03 | 2 | COMP-06 | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "fornecedor"` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | COMP-05 | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "deliver"` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 3 | MED-01 | unit | `pnpm --filter web test -- tests/lib/medicoes.test.ts -t "progresso"` | ❌ W0 | ⬜ pending |
| 04-05-02 | 05 | 3 | MED-02 | unit | `pnpm --filter web test -- tests/actions/medicoes.test.ts -t "contrato"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/tests/actions/orcamento.test.ts` — stubs for ORC-01, ORC-02, ORC-04, ORC-06
- [ ] `apps/web/tests/actions/compras.test.ts` — stubs for COMP-01, COMP-02, COMP-04, COMP-05, COMP-06
- [ ] `apps/web/tests/actions/medicoes.test.ts` — stubs for MED-02
- [ ] `apps/web/tests/lib/orcamento.test.ts` — stubs for ORC-03, ORC-05 (pure functions)
- [ ] `apps/web/tests/lib/compras.test.ts` — stubs for COMP-03 (buildMapa pure function)
- [ ] `apps/web/tests/lib/medicoes.test.ts` — stubs for MED-01 (calcularProgressoPonderado)
- [ ] API package: install `@react-pdf/renderer` — `pnpm --filter api add @react-pdf/renderer`
- [ ] Web package: install SheetJS from CDN — `pnpm --filter web add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mapa comparativo visual layout | COMP-03 | Visual rendering, layout accuracy | Compare 3 supplier quotes side-by-side, verify lowest price highlighted |
| PDF pedido de compra formatting | COMP-04 | PDF visual output | Download generated PDF, verify header, items, totals, empresa branding |
| PDF boletim de medicao formatting | MED-02 | PDF visual output | Download generated PDF, verify period, items, acumulado, approval status |
| SINAPI Excel import parsing | ORC-04 | File format variation | Upload real CAIXA SINAPI .xls, verify items parsed correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
