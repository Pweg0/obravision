---
phase: 2
slug: pdf-viewer-anchored-comments
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (to be configured — none detected in project) |
| **Config file** | `apps/web/vitest.config.ts` and `apps/api/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `pnpm --filter web vitest run --reporter=verbose` |
| **Full suite command** | `pnpm -r vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter web vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm -r vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PLNT-01 | unit | `pnpm --filter web vitest run tests/actions/plantas.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | PLNT-02 | unit | `pnpm --filter web vitest run tests/components/PlantaViewer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PLNT-03 | unit | `pnpm --filter web vitest run tests/actions/revisoes.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | PLNT-04 | unit | `pnpm --filter web vitest run tests/lib/coordinates.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | PLNT-05 | integration | `pnpm --filter api vitest run tests/socket/obra-room.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/vitest.config.ts` — configure jsdom environment for component tests
- [ ] `apps/api/vitest.config.ts` — configure node environment for socket/queue tests
- [ ] `apps/web/tests/lib/coordinates.test.ts` — covers PLNT-04 (coordinate normalization pure function)
- [ ] `apps/web/tests/actions/plantas.test.ts` — covers PLNT-01 (mock R2 client)
- [ ] `apps/web/tests/actions/revisoes.test.ts` — covers PLNT-03 (mock Prisma)
- [ ] `apps/web/tests/components/PlantaViewer.test.tsx` — covers PLNT-02 (mock react-pdf)
- [ ] `apps/api/tests/socket/obra-room.test.ts` — covers PLNT-05 (in-memory socket.io server)
- [ ] Framework install: `pnpm add -D --filter web vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom` and `pnpm add -D --filter api vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF renders visually correct with zoom/pan | PLNT-02 | Visual rendering in browser | Open viewer, zoom in/out, navigate pages, verify no artifacts |
| Pin placement survives zoom/resize | PLNT-04 | Browser viewport interaction | Place pin, zoom, resize window, verify pin stays at correct position |
| Toast + badge + sound notification | PLNT-05 | Audio/visual browser behavior | Open two sessions, create pin in one, verify toast+badge+sound in other |
| Large PDF (>50MB) upload and render | PLNT-01 | Requires real large file | Upload a >50MB construction PDF, verify it renders within acceptable time |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
