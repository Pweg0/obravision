# Milestones

## v1.0 MVP (Shipped: 2026-03-14)

**Phases completed:** 3 phases, 10 plans
**Stats:** 82 commits, 201 files, 15,430 LOC (TypeScript)
**Timeline:** 2026-03-13 → 2026-03-14

**Key accomplishments:**
- Auth (email/password + Google OAuth) with JWT sessions, PostgreSQL RLS multi-tenancy, and 3-step onboarding wizard
- Obra CRUD with member invitations (RBAC: admin/engenheiro/cliente), status management, and responsive dashboard
- PDF viewer with react-pdf rendering, anchored pins at normalized coordinates, threaded comments, and revision tracking (R0/R1/R2)
- Real-time notifications via Socket.io (new-pin, new-reply, @mention events) with toast, badge, and dedicated notifications page
- Interactive Gantt chart (@svar-ui/react-gantt) with drag-to-reschedule, weather alerts via Open-Meteo API for climate-sensitive tasks
- Daily diary (RDO) with R2 photo upload, auto-detected active task, progress calculation, and S-curve dashboard widget
- Public landing page with lead capture form

**UAT Results:**
- Phase 1: 14/14 pass
- Phase 2: 14/14 pass
- Phase 3: 9/10 pass (1 gap: RDO photo upload UI — deferred)

**Known Gaps:**
- RDO form missing photo upload UI (feature exists server-side but no form field)

---

