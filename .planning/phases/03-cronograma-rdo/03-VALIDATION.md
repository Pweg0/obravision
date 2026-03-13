---
phase: 3
slug: cronograma-rdo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.x (already configured from Phase 2) |
| **Config file** | `apps/web/vitest.config.ts` (exists), `apps/api/vitest.config.ts` (exists) |
| **Quick run command** | `pnpm --filter web test` |
| **Full suite command** | `pnpm --filter web test && pnpm --filter api test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter web test`
- **After every plan wave:** Run `pnpm --filter web test && pnpm --filter api test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CRON-01 | unit | `pnpm --filter web test -- tests/actions/cronograma.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CRON-02 | unit | `pnpm --filter web test -- tests/components/GanttView.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | CRON-03 | unit | `pnpm --filter api test -- tests/workers/weather-alert.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | RDO-01 | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 2 | RDO-02 | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 2 | RDO-03 | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/tests/actions/cronograma.test.ts` — covers CRON-01, CRON-02 (createTarefa, createEtapa, updateTarefaDates)
- [ ] `apps/web/tests/components/GanttView.test.tsx` — smoke test for Gantt rendering (CRON-02)
- [ ] `apps/web/tests/actions/rdo.test.ts` — covers RDO-01, RDO-02, RDO-03 (createRdoEntrada, getActiveTask, calcProgressoReal)
- [ ] `apps/api/tests/workers/weather-alert.test.ts` — covers CRON-03 (weather detection + notification)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gantt drag-and-drop moves task dates | CRON-02 | Browser interaction with drag events | Open Gantt, drag a task bar, verify dates update |
| Weather alert toast appears for climate-sensitive task | CRON-03 | Requires BullMQ cron + real weather API call | Mark task as climate-sensitive, wait for cron, verify notification |
| RDO photo upload and display | RDO-01 | Requires R2 bucket + browser file upload | Create RDO entry, upload photo with caption, verify display |
| Auto-detect active task pre-fills RDO | RDO-02 | Requires task in "Em andamento" status on current date | Create task covering today, open RDO form, verify pre-fill |
| Dual bar on Gantt shows real vs planned | RDO-03 | Visual rendering in browser | Create task + RDO entries, check Gantt shows dual bar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
