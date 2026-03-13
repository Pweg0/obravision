---
phase: 01-foundation
plan: "03"
subsystem: ui
tags: [next.js, react, tailwind, zod, react-hook-form, prisma, server-actions, marketing]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Monorepo scaffold, packages/db with Lead model and Prisma client, apps/web base setup

provides:
  - Public landing page at / with hero, features grid, and lead capture form
  - captureLead Server Action that upserts Lead records (no duplicate errors)
  - leadSchema Zod validator for email capture
  - Marketing route group (marketing) with no auth coupling
  - HeroSection, FeaturesSection, LeadCaptureForm, Footer components

affects:
  - auth (login/register pages link from marketing header)
  - database (Lead model consumed by captureLead action)

# Tech tracking
tech-stack:
  added:
    - react-hook-form ^7.53.2 (form state + validation)
    - "@hookform/resolvers ^3.9.0" (Zod adapter for react-hook-form)
    - zod ^3.23.8 (schema validation)
    - lucide-react ^0.447.0 (icons for features grid)
  patterns:
    - Server Action pattern with use server directive and FormData input
    - Zod safeParse for server-side validation with typed error returns
    - prisma.lead.upsert for idempotent lead capture (re-submissions succeed silently)
    - React Hook Form + zodResolver for client-side form validation
    - Marketing route group (marketing) with zero auth coupling
    - Success/error state swap pattern on form submission

key-files:
  created:
    - apps/web/app/(marketing)/page.tsx
    - apps/web/app/(marketing)/layout.tsx
    - apps/web/components/marketing/HeroSection.tsx
    - apps/web/components/marketing/FeaturesSection.tsx
    - apps/web/components/marketing/LeadCaptureForm.tsx
    - apps/web/components/marketing/Footer.tsx
    - apps/web/lib/actions/lead.ts
    - apps/web/lib/validations/lead.ts
    - packages/db/src/index.ts
  modified: []

key-decisions:
  - "Used prisma.lead.upsert with empty update{} for re-submissions — Lead schema has no updatedAt field, so upsert silently succeeds without erroring on duplicate emails"
  - "No auth() call anywhere in marketing layout or page — per RESEARCH.md pitfall 6, auth on landing page creates unnecessary session overhead"
  - "LeadCaptureForm is a Client Component using react-hook-form for instant validation UX; captureLead is a Server Action — clean boundary"
  - "Verde Obra #1A6B5A used as CSS inline style on hero gradient and submit button to ensure exact brand color without Tailwind config dependency"

patterns-established:
  - "Server Action pattern: use server + FormData + zodSchema.safeParse + typed return {success, error|message}"
  - "Marketing layout: no auth coupling, sticky header with logo + Entrar link, full-width children"
  - "Form success state: swap entire form for success message (not toast), avoids re-submission"

requirements-completed:
  - MKT-01

# Metrics
duration: 35min
completed: 2026-03-13
---

# Phase 1 Plan 3: Marketing Landing Page Summary

**Public landing page with Verde Obra hero, 6-feature grid, and email lead capture via Prisma upsert Server Action — zero auth coupling**

## Performance

- **Duration:** 35 min
- **Started:** 2026-03-13T18:05:04Z
- **Completed:** 2026-03-13T18:40:00Z
- **Tasks:** 1 of 1
- **Files modified:** 12

## Accomplishments

- Marketing landing page at `/` with professional construction-industry design (Verde Obra #1A6B5A gradient hero)
- Lead capture form with react-hook-form + Zod validation, success/error state swap, calls captureLead Server Action
- captureLead Server Action saves email to Lead table with upsert (re-submissions succeed silently, no duplicate errors)
- Feature showcase grid with 6 ObraVision capabilities and Lucide icons (responsive 1/2/3 column layout)
- Zero auth coupling — no auth() calls, no session cookies, no middleware on marketing routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Landing page with hero, features, and lead capture form** - `032bf53` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `apps/web/app/(marketing)/layout.tsx` - Marketing layout with sticky header, logo, Entrar link — no auth checks
- `apps/web/app/(marketing)/page.tsx` - Page composing Hero + Features + LeadCapture + Footer with SEO metadata
- `apps/web/components/marketing/HeroSection.tsx` - Full-width hero with Verde Obra gradient, headline, dual CTA anchors
- `apps/web/components/marketing/FeaturesSection.tsx` - 6-feature grid with Lucide icons, responsive 1/2/3 cols
- `apps/web/components/marketing/LeadCaptureForm.tsx` - Client Component: react-hook-form + Zod, calls captureLead, success/error states
- `apps/web/components/marketing/Footer.tsx` - Minimal footer with year, Resources/Beta/Entrar links
- `apps/web/lib/actions/lead.ts` - Server Action: validates email with leadSchema, upserts Lead record
- `apps/web/lib/validations/lead.ts` - Zod leadSchema for email validation (shared client/server)
- `packages/db/src/index.ts` - Prisma client singleton export with dev logging
- `apps/web/package.json` - Web app dependencies (react-hook-form, zod, lucide-react, etc.)
- `apps/web/tsconfig.json` - TypeScript config with @/* path alias and Next.js plugin
- `apps/web/next.config.ts` - Next.js config with transpilePackages for @obravision/db

## Decisions Made

- Used `prisma.lead.upsert` with empty `update: {}` because the Lead model has no `updatedAt` field — re-submissions succeed silently as intended
- No `auth()` call in marketing layout — following RESEARCH.md pitfall 6 to avoid session overhead on the public landing page
- LeadCaptureForm is a Client Component for instant form validation UX; captureLead stays a Server Action — clean boundary with no prop drilling of actions
- Verde Obra `#1A6B5A` used as inline CSS on hero and submit button to guarantee exact brand color without requiring Tailwind config setup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed non-existent updatedAt field from Lead upsert**
- **Found during:** Task 1 (lead.ts Server Action)
- **Issue:** Plan said "upsert Lead record, re-submissions update timestamp" but the Lead model in schema.prisma has no `updatedAt` field (only `createdAt`)
- **Fix:** Changed `update: { updatedAt: new Date() }` to `update: {}` — upsert still succeeds silently on duplicate email with no error
- **Files modified:** `apps/web/lib/actions/lead.ts`
- **Verification:** TypeScript check passed, build succeeded
- **Committed in:** `032bf53` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Minimal — behavior matches intent (silent success on re-submission). No scope creep.

## Issues Encountered

- pnpm not in PATH on this machine — resolved by running `npx pnpm@9 install` from monorepo root
- Next.js build initially failed due to missing Prisma client generation — resolved by running `prisma generate` first (expected prerequisite)
- `next build` CLI wrapper uses WSL `/mnt/c/` paths in bash shebang but machine uses Windows Git Bash — invoked binary directly via `node /path/to/next/dist/bin/next`

## User Setup Required

None — no external service configuration required for the marketing page itself. The lead capture form requires a running PostgreSQL database with migrations applied and `DATABASE_URL` set in `.env` before leads can be saved.

## Next Phase Readiness

- Marketing landing page complete, no blocking issues for Phase 1 auth work
- Entrar link points to `/login` — ready for plan 01-02 (auth) to implement that route
- Lead model is in schema.prisma, migration needs to be run before first deployment
- No auth coupling verified — marketing routes load without session middleware

---
*Phase: 01-foundation*
*Completed: 2026-03-13*
