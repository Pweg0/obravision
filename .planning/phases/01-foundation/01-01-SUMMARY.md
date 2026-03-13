---
phase: 01-foundation
plan: "01"
subsystem: auth
tags: [nextauth, auth-js-v5, prisma, postgresql, rls, jwt, bcrypt, zod, react-hook-form, turborepo, pnpm-workspaces, fastify]

# Dependency graph
requires: []
provides:
  - "pnpm monorepo scaffold with Turborepo (apps/web, apps/api, packages/db, packages/types)"
  - "Prisma 5 schema with all Phase 1 models (User, Empresa, Obra, ObraStatus, ObraMember, Invitation, PasswordResetToken, Lead, Auth.js models)"
  - "PostgreSQL RLS migration for tenant-isolated tables (obras, obra_statuses, obra_members, invitations)"
  - "createTenantClient() Prisma Client Extension setting app.current_tenant_id via set_config"
  - "Auth.js v5 with Credentials + Google OAuth, JWT strategy, empresaId+role+onboardingStep in session"
  - "Server Actions: register, login, forgotPassword, resetPassword"
  - "Auth UI pages: /login, /register, /forgot-password, /reset-password"
  - "Middleware protecting /dashboard and /onboarding routes, redirecting to onboarding when empresaId missing"
  - "Vitest configured in packages/db with RLS isolation tests (unit + integration)"
affects:
  - 01-02-onboarding
  - 01-03-marketing
  - 02-obras-crud
  - all-future-phases

# Tech tracking
tech-stack:
  added:
    - "Next.js 15.3.0 (App Router)"
    - "Auth.js / next-auth 5.0.0-beta.25"
    - "@auth/prisma-adapter 2.7.2"
    - "Prisma 5.22.0"
    - "PostgreSQL RLS via set_config()"
    - "Fastify 5 (scaffold)"
    - "Turborepo (build orchestration)"
    - "pnpm workspaces"
    - "bcryptjs 2.4.3 (password hashing)"
    - "nanoid 5 (reset tokens)"
    - "Resend (password reset emails)"
    - "Zod 3 (form validation)"
    - "React Hook Form 7 (@hookform/resolvers)"
    - "TailwindCSS 3 + shadcn-compatible UI components"
    - "Vitest 1.6 (test infrastructure)"
  patterns:
    - "JWT session strategy (required for Credentials provider with Auth.js)"
    - "Prisma Client Extension for RLS tenant context per query"
    - "Server Actions for all auth mutations (register, login, forgotPassword, resetPassword)"
    - "useSearchParams wrapped in Suspense boundary (Next.js 15 requirement)"
    - "Manual password hashing in Server Action before signIn (adapter does not store passwords)"

key-files:
  created:
    - packages/db/prisma/schema.prisma
    - packages/db/src/index.ts
    - packages/db/src/rls-client.ts
    - packages/db/prisma/migrations/00000000000001_rls_policies/migration.sql
    - packages/db/vitest.config.ts
    - packages/db/tests/rls-isolation.test.ts
    - packages/types/src/auth.ts
    - packages/types/src/obra.ts
    - apps/web/lib/auth.ts
    - apps/web/lib/auth-actions.ts
    - apps/web/lib/validations/auth.ts
    - apps/web/middleware.ts
    - apps/web/app/api/auth/[...nextauth]/route.ts
    - apps/web/app/(auth)/login/page.tsx
    - apps/web/app/(auth)/register/page.tsx
    - apps/web/app/(auth)/forgot-password/page.tsx
    - apps/web/app/(auth)/reset-password/page.tsx
    - apps/api/src/app.ts
    - apps/api/src/plugins/tenant.ts
  modified:
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/next.config.ts

key-decisions:
  - "JWT session strategy (not database) — mandatory for Auth.js Credentials provider; database sessions break credential logins"
  - "Manual passwordHash in Server Action — Prisma adapter doesn't store passwords, register action does bcrypt.hash() before signIn()"
  - "RLS policies via plain SQL migration file — enables database-enforced tenant isolation, not just application-layer WHERE clauses"
  - "createTenantClient uses $transaction with set_config TRUE — scopes to current transaction, safe with connection poolers"
  - "RLS integration tests skip without INTEGRATION_TEST=true — avoids CI failures without a real DB, unit test always runs"
  - "useSearchParams in reset-password wrapped in Suspense — required by Next.js 15 for static prerendering"

patterns-established:
  - "Auth pattern: JWT callbacks add empresaId, role, onboardingStep to token — eliminates extra DB query per page"
  - "RLS pattern: createTenantClient(tenantId) wraps all queries with set_config for tenant isolation"
  - "Form pattern: React Hook Form + Zod resolver on client, Zod re-validation on server in Server Action"
  - "Auth redirect pattern: middleware checks session.user.empresaId for onboarding redirect"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04

# Metrics
duration: 15min
completed: 2026-03-13
---

# Phase 1 Plan 01: Foundation Summary

**pnpm monorepo with Prisma RLS multi-tenancy, Auth.js v5 JWT auth (Credentials + Google OAuth), password reset via Resend, and four auth UI pages**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-13T18:04:54Z
- **Completed:** 2026-03-13T18:20:00Z
- **Tasks:** 2 (Task 1: Monorepo + schema; Task 2: Auth config + pages + tests)
- **Files modified:** 43+

## Accomplishments

- Full pnpm workspace monorepo with Turborepo build pipeline (apps/web, apps/api, packages/db, packages/types)
- Complete Prisma 5 schema with all Phase 1 models including Auth.js required models and tenant isolation fields
- PostgreSQL RLS policies for tenant-scoped tables with USING + WITH CHECK clauses, plus createTenantClient() Prisma Extension
- Auth.js v5 with Credentials + Google OAuth using JWT strategy, empresaId/role/onboardingStep in session JWT
- Four auth UI pages (login, register, forgot-password, reset-password) with React Hook Form + Zod validation
- Password reset flow via Resend email with nanoid(32) tokens, 1h expiry, used-once enforcement
- Middleware protecting /dashboard + /onboarding, onboarding redirect when empresaId is null
- Vitest configured in packages/db with RLS isolation test (unit always runs; integration skips without real DB)

## Task Commits

Each task was committed atomically:

1. **Task 1: Monorepo scaffold, Prisma schema with RLS, test infrastructure, and shared types** - `cfd3bbf` (feat)
2. **Task 2: Auth.js v5 config, auth pages, password reset flow, and RLS isolation test** - `84121a4` (feat)

## Files Created/Modified

- `packages/db/prisma/schema.prisma` - All Phase 1 models: User, Empresa, Obra, ObraStatus, ObraMember, Invitation, PasswordResetToken, Lead + Auth.js models
- `packages/db/src/rls-client.ts` - createTenantClient() with Prisma Client Extension for set_config RLS context
- `packages/db/prisma/migrations/00000000000001_rls_policies/migration.sql` - RLS policies for tenant-scoped tables
- `packages/db/src/index.ts` - Singleton PrismaClient with global cache
- `packages/db/vitest.config.ts` - Vitest config (globals, node environment, tests/ include pattern)
- `packages/db/tests/rls-isolation.test.ts` - RLS unit + integration tests
- `packages/types/src/auth.ts` - Role enum, SessionUser, AppSession, AppJWT types
- `packages/types/src/obra.ts` - ObraTipo enum, Obra, ObraStatus, ObraMember interfaces
- `apps/web/lib/auth.ts` - Auth.js v5 NextAuth config with Credentials + Google, JWT callbacks, session extension
- `apps/web/lib/auth-actions.ts` - Server Actions: register, login, forgotPassword, resetPassword
- `apps/web/lib/validations/auth.ts` - Zod schemas for all four auth forms
- `apps/web/middleware.ts` - Auth guard with onboarding redirect logic
- `apps/web/app/api/auth/[...nextauth]/route.ts` - Auth.js route handler
- `apps/web/app/(auth)/login/page.tsx` - Login form + Google OAuth button
- `apps/web/app/(auth)/register/page.tsx` - Registration form + Google OAuth button
- `apps/web/app/(auth)/forgot-password/page.tsx` - Forgot password form with success state
- `apps/web/app/(auth)/reset-password/page.tsx` - Reset password form reading token from URL
- `apps/api/src/app.ts` - Fastify 5 scaffold with health check endpoint
- `apps/api/src/plugins/tenant.ts` - Tenant RLS plugin stub for Phase 2+

## Decisions Made

- **JWT session strategy mandatory** — Auth.js Credentials provider breaks with database sessions; `session: { strategy: "jwt" }` is required
- **Manual passwordHash** — Prisma adapter never stores passwords; register Server Action must call `bcrypt.hash()` before `signIn()`
- **RLS via SQL migration file** — plain SQL run after Prisma creates tables; USING + WITH CHECK on all tenant-scoped tables
- **set_config with TRUE (transaction-scoped)** — safer than session-scoped setting; works correctly with connection poolers like PgBouncer
- **RLS integration tests conditional** — `INTEGRATION_TEST=true` env var required; avoids CI failures without a real PostgreSQL instance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed JWT module augmentation that does not exist in next-auth v5 beta**
- **Found during:** Task 2 (TypeScript type check)
- **Issue:** `declare module "next-auth/jwt"` causes TS2664 in next-auth v5 beta — the jwt module is not separately exported
- **Fix:** Removed JWT module augmentation; used `as string` casts in session callback for token fields
- **Files modified:** apps/web/lib/auth.ts
- **Verification:** `pnpm tsc --noEmit` passes with zero errors
- **Committed in:** 84121a4 (Task 2 commit)

**2. [Rule 3 - Blocking] Wrapped useSearchParams in Suspense boundary for Next.js 15**
- **Found during:** Task 2 (pnpm build)
- **Issue:** Next.js 15 requires `useSearchParams()` to be wrapped in Suspense boundary for static prerendering
- **Fix:** Split reset-password page into inner `ResetPasswordForm` component + outer page export with `<Suspense>` wrapper
- **Files modified:** apps/web/app/(auth)/reset-password/page.tsx
- **Verification:** `pnpm build` succeeds, /reset-password route renders as static
- **Committed in:** 84121a4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking issues — TypeScript compatibility + Next.js 15 SSG requirement)
**Impact on plan:** Both fixes necessary for TypeScript correctness and build success. No scope creep.

## Issues Encountered

- pnpm packageManager version mismatch (declared `pnpm@9.0.0`, actual installed is `pnpm@10.32.1`) — fixed by updating packageManager field
- `pnpm install` needed `--no-frozen-lockfile` flag on first run since lockfile didn't include the new api/ workspace packages
- Prisma `generate` script required `pnpm approve-builds` for native binary — worked around by running generate directly

## User Setup Required

To enable full auth functionality, the following environment variables must be configured in `.env.local`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/obravision
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
RESEND_API_KEY=<from resend.com>
```

After setting DATABASE_URL, run:
```bash
cd packages/db && pnpm prisma db push
# Then apply RLS policies:
psql $DATABASE_URL -f prisma/migrations/00000000000001_rls_policies/migration.sql
```

## Next Phase Readiness

- Monorepo structure and build pipeline ready for Phase 1 Plans 02 and 03
- All auth exports (auth, signIn, signOut, handlers) available to downstream phases
- createTenantClient() ready for use in Phase 2 obra CRUD operations
- Middleware auth guard in place — /dashboard and /onboarding routes protected
- RLS isolation test ready to run with `INTEGRATION_TEST=true` against real database

## Self-Check: PASSED

All key files verified present:
- packages/db/prisma/schema.prisma — FOUND
- packages/db/src/rls-client.ts — FOUND
- apps/web/lib/auth.ts — FOUND
- apps/web/lib/auth-actions.ts — FOUND
- apps/web/middleware.ts — FOUND
- All 4 auth pages — FOUND
- packages/db/vitest.config.ts — FOUND
- packages/db/tests/rls-isolation.test.ts — FOUND

All commits verified:
- cfd3bbf (Task 1: Monorepo scaffold) — FOUND
- 84121a4 (Task 2: Auth config + pages) — FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-13*
