---
phase: 01-foundation
plan: "02"
subsystem: onboarding-obra-invite-dashboard
tags: [onboarding, obra-crud, invite, dashboard, rbac, rls, resend, nanoid, zod, react-hook-form, server-actions]

# Dependency graph
requires:
  - "01-01: Auth.js v5 config, Prisma schema, RLS client, middleware"
provides:
  - "3-step onboarding wizard (empresa > obra > equipe) with DB persistence per step"
  - "Obra CRUD Server Actions (create, update, archive, unarchive, list) with RLS tenant isolation"
  - "Custom ObraStatus CRUD per empresa (create, update, delete with usage check)"
  - "Obra listing with cards/table toggle (localStorage persist), status/tipo/search filters"
  - "Member invitation system: email via Resend + shareable link via nanoid tokens"
  - "Invite accept flow with session refresh for empresa-level invites"
  - "Dashboard layout with responsive sidebar, navigation, user profile"
  - "Dashboard widgets: ObraListWidget, ActivityWidget, 2 placeholder widgets (Clima, Comentarios)"
  - "Role-based permission enforcement on all mutation Server Actions"
affects:
  - 02-pdf-viewer
  - all-future-phases

# Tech tracking
tech-stack:
  added:
    - "nanoid 5 (invite tokens)"
    - "Resend (invite emails with HTML template)"
  patterns:
    - "Server Actions with RLS tenant client for all obra/status/invite mutations"
    - "FormData-based Server Actions with Zod validation (server-side re-validation)"
    - "Client-side view toggle with localStorage persistence (no Zustand needed)"
    - "Session refresh via cookie deletion on empresa-level invite accept"
    - "Derived activity feed from obra/member createdAt timestamps"

key-files:
  created:
    - apps/web/app/onboarding/layout.tsx
    - apps/web/app/onboarding/empresa/page.tsx
    - apps/web/app/onboarding/obra/page.tsx
    - apps/web/app/onboarding/equipe/page.tsx
    - apps/web/components/onboarding/StepIndicator.tsx
    - apps/web/components/onboarding/StepEmpresa.tsx
    - apps/web/components/onboarding/StepObra.tsx
    - apps/web/components/onboarding/StepEquipe.tsx
    - apps/web/lib/actions/onboarding.ts
    - apps/web/lib/actions/obra.ts
    - apps/web/lib/actions/status.ts
    - apps/web/lib/actions/invite.ts
    - apps/web/lib/validations/obra.ts
    - apps/web/lib/validations/invite.ts
    - apps/web/app/(dashboard)/layout.tsx
    - apps/web/app/(dashboard)/dashboard/page.tsx
    - apps/web/app/(dashboard)/dashboard/obras/page.tsx
    - apps/web/app/(dashboard)/dashboard/obras/ObrasClient.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/page.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/ObraDetailClient.tsx
    - apps/web/app/(dashboard)/dashboard/obras/[id]/StatusManager.tsx
    - apps/web/app/(dashboard)/dashboard/obras/archived/page.tsx
    - apps/web/app/(dashboard)/dashboard/obras/archived/ArchivedObrasClient.tsx
    - apps/web/components/obra/ObraCard.tsx
    - apps/web/components/obra/ObraTable.tsx
    - apps/web/components/obra/ObraForm.tsx
    - apps/web/components/obra/StatusBadge.tsx
    - apps/web/components/obra/ViewToggle.tsx
    - apps/web/components/invite/InviteByEmail.tsx
    - apps/web/components/invite/ShareableLink.tsx
    - apps/web/components/dashboard/DashboardLayout.tsx
    - apps/web/components/dashboard/ObraListWidget.tsx
    - apps/web/components/dashboard/ActivityWidget.tsx
    - apps/web/components/dashboard/PlaceholderWidget.tsx
    - apps/web/app/invite/[token]/page.tsx
    - apps/web/app/invite/[token]/AcceptInviteClient.tsx
  modified:
    - apps/web/middleware.ts
    - packages/db/package.json

key-decisions:
  - "localStorage for view toggle persistence instead of Zustand — simpler, no extra dependency for single key"
  - "Session refresh via cookie deletion on empresa-level invite — unstable_update not available in Auth.js beta.25"
  - "Derived activity feed from obra/member timestamps — no separate audit log table needed in Phase 1"
  - "Dashboard pages nested under /dashboard route group — (dashboard)/dashboard/page.tsx pattern"
  - "Added /invite to middleware PUBLIC_PATHS — invite accept page must be accessible without empresa check"

requirements-completed:
  - AUTH-05
  - OBRA-01
  - OBRA-02
  - OBRA-03

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 1 Plan 02: Onboarding, Obra CRUD, Invitations, and Dashboard Summary

**3-step onboarding wizard with DB persistence, obra CRUD with custom statuses and cards/table toggle, email+link invite system with Resend, and responsive dashboard with real data widgets**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T20:41:53Z
- **Completed:** 2026-03-13T20:45:06Z
- **Tasks:** 2 (Task 1: Onboarding + Obra CRUD; Task 2: Invitations + Dashboard)
- **Files created/modified:** 38

## Accomplishments

### Task 1: Onboarding Wizard + Obra CRUD

- 3-step onboarding wizard: Step 1 creates empresa (nome only), Step 2 creates obra (nome, address, tipo, area), Step 3 allows invite or skip
- Each onboarding step persists to DB immediately via Server Action (onboardingStep updated in User record)
- createEmpresa creates 3 default ObraStatus entries ("Em execucao" #1A6B5A, "Paralisada" #EAB308, "Concluida" #16A34A)
- Obra CRUD Server Actions: createObra, updateObra, archiveObra, unarchiveObra, listObras — all using createTenantClient for RLS isolation
- Custom ObraStatus CRUD: create, update, delete (with usage check — cannot delete if obras reference it)
- Obra listing page with cards/table view toggle (persisted to localStorage), search by nome, filter by status and tipo
- Obra detail page with tab navigation (Detalhes, Equipe, Status), edit modal, archive confirmation dialog
- Archived obras in separate tab with unarchive action
- Zod validation: obraSchema (nome 3-100 chars, address fields, estado 2-char enum, cep 8 digits, tipo enum, area positive number)
- Role-based permissions: Admin can archive/manage statuses, Admin+Engenheiro can create/edit, Cliente view-only

### Task 2: Invitations + Dashboard

- Email invitations via Resend: HTML template with Verde Obra branding, role info, CTA button, 7-day expiry
- Shareable link invitations: nanoid(21) tokens, 30-day expiry, copy-to-clipboard, regenerate with old token invalidation
- Invite accept page: Server Component validates token state (invalid, used, expired, wrong email) with Portuguese error messages
- Empresa-level invite accept: updates User.empresaId + role, deletes session cookies to force JWT re-issue via Auth.js
- Dashboard layout: responsive sidebar with ObraVision logo, nav items (Dashboard, Obras), user avatar with initials fallback, logout via signOut
- Dashboard page: ObraListWidget (5 most recent with status badge), ActivityWidget (derived from obra/member timestamps), 2 PlaceholderWidgets (Alertas de Clima, Comentarios Pendentes)
- Middleware updated: /invite added to PUBLIC_PATHS so invite accept page works without empresa check
- InviteByEmail component: email + role selector form, success/error states, pending indicator
- ShareableLink component: role selector, generate button, active/expired indicator, copy button, regenerate link
- Permission enforcement: only Admin and Engenheiro can send invites (CONTEXT.md locked decision)

## Task Commits

1. **Task 1: Onboarding wizard, obra CRUD with custom statuses** - `173ff25` (feat)
2. **Task 2: Member invitations, dashboard with widgets, invite accept flow** - `00b09fa` (feat)

## Deviations from Plan

None - plan executed exactly as written. All files existed from previous implementation and passed TypeScript check and Next.js build without modifications.

## Decisions Made

- **localStorage over Zustand for view toggle** — Single boolean value does not justify adding a state management library; localStorage.getItem/setItem is sufficient
- **Cookie deletion for session refresh** — Auth.js v5 beta.25 does not expose unstable_update(); deleting the session cookie forces re-authentication which triggers the JWT callback to read updated empresaId from DB
- **Derived activity feed** — No audit log table needed in Phase 1; activity items are derived from obra.createdAt and obraMember.createdAt timestamps, sorted by recency
- **Dashboard route nesting** — Pages live at (dashboard)/dashboard/page.tsx using Next.js route groups; the (dashboard) group provides the sidebar layout while /dashboard is the URL path

## Verification

- `pnpm tsc --noEmit` passes with zero errors
- `pnpm build` succeeds with all 14 routes generated (5 static, 5 dynamic + middleware)
- All routes render: /, /login, /register, /forgot-password, /reset-password, /onboarding/empresa, /onboarding/obra, /onboarding/equipe, /dashboard, /dashboard/obras, /dashboard/obras/[id], /dashboard/obras/archived, /invite/[token]

## Self-Check: PASSED

All 28 key files verified present.
Both commits verified: 173ff25 (Task 1), 00b09fa (Task 2).
TypeScript check clean. Build succeeds with all routes.

---
*Phase: 01-foundation*
*Completed: 2026-03-13*
