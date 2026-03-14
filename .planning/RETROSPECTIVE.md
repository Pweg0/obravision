# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-14
**Phases:** 3 | **Plans:** 10 | **Commits:** 82

### What Was Built
- Full auth system with RLS multi-tenancy, Google OAuth, and 3-step onboarding
- PDF viewer with anchored pins, threaded comments, and revision tracking
- Real-time notifications via Socket.io (pin, reply, mention events)
- Interactive Gantt chart with weather alerts for climate-sensitive tasks
- Daily diary (RDO) with photo upload, auto-task detection, and S-curve progress
- Public landing page with lead capture

### What Worked
- Server Actions pattern (Next.js) kept mutations simple and type-safe
- RLS multi-tenancy via Prisma Client Extension worked well for tenant isolation
- Parallel plan execution (wave-based) significantly reduced wall-clock time
- CSS percentage positioning for pins eliminated all zoom/resize recalculation

### What Was Inefficient
- @svar-ui/react-gantt had broken exports requiring manual webpack aliases and pnpm symlink workarounds
- Email sending silently failed due to unverified Resend domain — should validate email config during setup
- Phase 2 plan 02-04 was a gap closure for notification wiring that should have been caught during planning

### Patterns Established
- `createTenantClient()` for RLS-scoped Prisma operations
- `getTenantContextSafe()` returning null instead of redirect for flexible server action contexts
- `emitNotification()` as non-fatal helper — socket/notification errors never fail primary actions
- Dynamic import with `ssr: false` for browser-only libraries (Gantt, Socket.io)
- R2 presigned upload pattern: server generates URL, client uploads directly

### Key Lessons
1. Always import CSS for third-party chart libraries explicitly — missing styles cause invisible rendering failures
2. Follow pnpm symlinks with `fs.realpathSync()` when configuring webpack aliases in monorepos
3. Test email delivery in staging with verified sender domains before shipping
4. Gap closure plans indicate missed scope in original planning — invest more in upfront integration analysis

### Cost Observations
- Model mix: predominantly opus for execution, sonnet for research/planning
- Sessions: ~10 sessions across 2 days
- Notable: 82 commits in 2 days for full MVP — high velocity from parallel plan execution

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 82 | 3 | Initial process — established GSD workflow |

### Cumulative Quality

| Milestone | UAT Tests | Pass Rate | Known Gaps |
|-----------|-----------|-----------|------------|
| v1.0 | 38 | 97% (37/38) | 1 (RDO photo UI) |

### Top Lessons (Verified Across Milestones)

1. Validate third-party library CSS and export compatibility before committing to a dependency
2. Non-fatal helpers for cross-cutting concerns (notifications, analytics) prevent cascade failures
