# Roadmap: ObraVision

## Overview

ObraVision is built in five phases that follow strict dependency order. The foundation (auth, multi-tenancy, obra CRUD) unlocks everything. The PDF viewer with anchored comments is the core differentiator and must be validated with real beta users as early as possible — no Brazilian competitor offers it. Once that moat is validated, the field-workflow modules (Cronograma + RDO) make the product table stakes for conservative engenheiro adopters. The financial operations layer (Orcamento + Compras + Medicoes) justifies paid plans. Reporting closes the loop for managers and clients. Every phase delivers a coherent, demoable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Auth, obra CRUD, onboarding wizard, and public landing page — the system exists and users can log in
- [ ] **Phase 2: PDF Viewer + Anchored Comments** - Core differentiator: upload plants, view them, place pins with threaded comments and real-time notifications
- [ ] **Phase 3: Cronograma + RDO** - Schedule management and daily diary — the table-stakes field workflow that makes the product a non-negotiable for Brazilian engineers
- [ ] **Phase 4: Orcamento + Compras + Medicoes** - Budget, procurement, inventory, and physical measurements — the operational depth that justifies paid plans
- [ ] **Phase 5: Relatorios + Dashboards** - Management reports, KPI dashboards, and PDF export — the output layer that closes the loop for managers and clients

## Phase Details

### Phase 1: Foundation
**Goal**: Engineers can sign up, create an obra, invite their team, and start using the product — all within 5 minutes of landing on the page
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, OBRA-01, OBRA-02, OBRA-03, MKT-01
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password or Google OAuth and stay logged in across browser refreshes
  2. User can reset a forgotten password via an email link
  3. User can complete the 3-step onboarding wizard (create empresa > create obra > invite equipe) in under 5 minutes
  4. User can create, edit, and archive obras with addresses and status, and invite members with admin/engenheiro/cliente roles
  5. Public landing page exists with lead capture form so potential users can find and evaluate the product
**Plans**: 3 plans

Plans:
- [x] 01-01: Monorepo setup, PostgreSQL schema with RLS multi-tenancy, Auth.js v5 with email/password + Google OAuth
- [x] 01-02: Obra CRUD, member invite with RBAC, 3-step onboarding wizard
- [x] 01-03: Public landing page with lead capture

### Phase 2: PDF Viewer + Anchored Comments
**Goal**: Engineers and clients can look at the same plant, place pins at exact coordinates, discuss in threads, and get notified in real time — with plant revisions tracked by version number
**Depends on**: Phase 1
**Requirements**: PLNT-01, PLNT-02, PLNT-03, PLNT-04, PLNT-05
**Success Criteria** (what must be TRUE):
  1. User can upload a plant PDF (including files >50MB) and it renders in full-screen viewer with zoom and page navigation
  2. User can click any point on the plant to place a pin, write a comment, and start a thread — pin coordinates survive page zoom and browser resize
  3. User can upload a new plant revision (R0, R1, R2) with a changelog entry, and older revisions remain accessible
  4. User receives a real-time notification (without page refresh) when a teammate places a new pin or replies to a thread on a plant they are viewing
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Prisma models, R2 presigned upload, BullMQ PDF-to-WebP conversion pipeline, plant listing by disciplina, Vitest infrastructure
- [x] 02-02-PLAN.md — PDF viewer with react-pdf + tile rendering, pin overlay with normalized coordinates, threaded comment sidebar, revision dropdown
- [x] 02-03-PLAN.md — Socket.io WebSocket hub (room-per-obra), real-time notifications with toast + badge + sound, dedicated notifications page
- [ ] 02-04-PLAN.md — Gap closure: wire emitNotification into createPin and addMessage for real-time pin/reply/mention notifications

### Phase 3: Cronograma + RDO
**Goal**: Engineers can manage a construction schedule with Gantt view and weather alerts, and field teams can log daily diary entries linked to active tasks — creating a closed loop between office planning and site execution
**Depends on**: Phase 2
**Requirements**: CRON-01, CRON-02, CRON-03, RDO-01, RDO-02, RDO-03
**Success Criteria** (what must be TRUE):
  1. User can create tasks with start/end dates, responsavel, status, and parent stage, then view them in an interactive Gantt chart with drag-to-edit dependencies
  2. System automatically alerts the user when weather forecast predicts rain for tasks marked as climate-sensitive on their dates
  3. User can create a daily RDO entry with text, photos, and auto-detected weather for the day
  4. System pre-fills the diary with the active task from the schedule so field teams do not have to search manually
  5. System calculates real vs planned progress by cross-referencing diary entries with the schedule, visible to the engineer
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Etapa + Tarefa Prisma models with RLS, CRUD server actions, interactive Gantt chart with @svar-ui/react-gantt, drag-to-reschedule
- [ ] 03-02-PLAN.md — BullMQ weather cron job with Open-Meteo API, climate-sensitive task alerting, Obra geocoding, Gantt rain icons
- [ ] 03-03-PLAN.md — RDO diary model with R2 photo upload, auto-detect active task, progress calculation, S-curve dashboard widget

### Phase 4: Orcamento + Compras + Medicoes
**Goal**: Engineers can build a complete obra budget with SINAPI codes and BDI, manage procurement from purchase request to purchase order, track inventory across storage locations, and record physical and contract measurements — turning ObraVision into the operational hub for a construction project
**Depends on**: Phase 3
**Requirements**: ORC-01, ORC-02, ORC-03, ORC-04, ORC-05, ORC-06, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, MED-01, MED-02
**Success Criteria** (what must be TRUE):
  1. User can search SINAPI codes, add items to a budget by obra stage with quantities and unit costs, apply BDI, and view both cost and sales views
  2. User can generate a commercial proposal (proposta comercial) from the budget in 2 clicks and view the Curva ABC de insumos
  3. User can create a purchase request, run it through an approval workflow, generate supplier quotes with a comparative map, and issue a purchase order linked to the budget
  4. User can track inventory per obra across multiple depositos, see real material costs consumed, and know when stock from a purchase order has been received
  5. User can record physical progress measurements per obra stage and contract measurements for subcontractors
**Plans**: TBD

Plans:
- [ ] 04-01: SINAPI code search and budget builder (stages, quantities, unit costs), BDI configuration, cost/sales views
- [ ] 04-02: Proposta comercial export, Curva ABC de insumos view
- [ ] 04-03: Purchase request with approval workflow, supplier quote with mapa comparativo, purchase order integrated with budget
- [ ] 04-04: Inventory tracking per obra and deposito, real material cost view
- [ ] 04-05: Physical progress measurements (MED-01) and subcontractor contract measurements (MED-02)

### Phase 5: Relatorios + Dashboards
**Goal**: Engineers and managers can view integrated management reports, a KPI dashboard per obra, and export everything as a PDF — giving leadership the visibility they need without scheduling a meeting
**Depends on**: Phase 4
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. User can view a management report showing obra evolution, costs, payments, and photos in one integrated view
  2. User can view a KPI dashboard per obra with key indicators (progress, budget variance, open tasks, recent RDO activity)
  3. User can export an obra report as a PDF suitable for sharing with clients or fiscais
**Plans**: TBD

Plans:
- [ ] 05-01: Management report view (evolution, costs, payments, photos) and KPI dashboard per obra
- [ ] 05-02: PDF export for obra report (server-side rendering, R2 storage, download link)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-13 |
| 2. PDF Viewer + Anchored Comments | 3/4 | Gap closure | - |
| 3. Cronograma + RDO | 0/3 | Not started | - |
| 4. Orcamento + Compras + Medicoes | 0/5 | Not started | - |
| 5. Relatorios + Dashboards | 0/2 | Not started | - |
