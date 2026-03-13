---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x (unit/integration), Playwright (E2E) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test:all` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test:all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUTH-01 | integration | `pnpm test auth` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | AUTH-02 | integration | `pnpm test auth` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | AUTH-03 | integration | `pnpm test auth` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | AUTH-04 | integration | `pnpm test auth` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | AUTH-05 | unit | `pnpm test onboarding` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | OBRA-01 | integration | `pnpm test obra` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | OBRA-02 | integration | `pnpm test obra` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | OBRA-03 | integration | `pnpm test obra` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | MKT-01 | e2e | `pnpm test:e2e landing` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` — test framework setup
- [ ] `playwright` — E2E framework setup
- [ ] `packages/db/tests/` — Prisma test helpers and fixtures
- [ ] `apps/api/tests/` — Fastify test server factory
- [ ] `apps/web/tests/` — Next.js component test setup

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth flow | AUTH-02 | Requires real Google OAuth redirect | Sign up with Google account, verify session persists |
| Email delivery (reset password) | AUTH-04 | Requires Resend.com integration | Trigger password reset, check email arrives |
| Onboarding < 5 min | AUTH-05 | UX timing test | Time full flow: signup > create empresa > create obra > invite |
| Landing page visual quality | MKT-01 | Visual/subjective | Review design matches Mais Controle reference quality |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
