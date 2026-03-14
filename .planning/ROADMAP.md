# Roadmap: ProjetaPro

## Overview

ProjetaPro is built in phases that follow strict dependency order. The foundation (auth, multi-tenancy, obra CRUD) unlocks everything. The PDF viewer with anchored comments is the core differentiator. The field-workflow modules (Cronograma + RDO) make the product table stakes. The financial operations layer justifies paid plans. Reporting closes the loop for managers and clients.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 (shipped 2026-03-14)
- 📋 **v1.1** — Phases 4-5 (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-03-14</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-03-13
- [x] Phase 2: PDF Viewer + Anchored Comments (4/4 plans) — completed 2026-03-14
- [x] Phase 3: Cronograma + RDO (3/3 plans) — completed 2026-03-13

Full details archived in `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 📋 v1.1 (Planned)

- [ ] Phase 4: Orcamento + Compras + Medicoes (5 plans)
- [ ] Phase 5: Relatorios + Dashboards (2 plans)

## Phase Details

### Phase 4: Orcamento + Compras + Medicoes
**Goal**: Engineers can build a complete obra budget with SINAPI codes and BDI, manage procurement from purchase request to purchase order, track inventory across storage locations, and record physical and contract measurements
**Depends on**: Phase 3
**Requirements**: ORC-01, ORC-02, ORC-03, ORC-04, ORC-05, ORC-06, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, MED-01, MED-02
**Plans**: 5 plans

Plans:
- [ ] 04-01: SINAPI code search and budget builder (stages, quantities, unit costs), BDI configuration, cost/sales views
- [ ] 04-02: Proposta comercial export, Curva ABC de insumos view
- [ ] 04-03: Purchase request with approval workflow, supplier quote with mapa comparativo, purchase order integrated with budget
- [ ] 04-04: Inventory tracking per obra and deposito, real material cost view
- [ ] 04-05: Physical progress measurements (MED-01) and subcontractor contract measurements (MED-02)

### Phase 5: Relatorios + Dashboards
**Goal**: Engineers and managers can view integrated management reports, a KPI dashboard per obra, and export everything as a PDF
**Depends on**: Phase 4
**Requirements**: REL-01, REL-02, REL-03
**Plans**: 2 plans

Plans:
- [ ] 05-01: Management report view (evolution, costs, payments, photos) and KPI dashboard per obra
- [ ] 05-02: PDF export for obra report (server-side rendering, R2 storage, download link)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-13 |
| 2. PDF Viewer + Anchored Comments | v1.0 | 4/4 | Complete | 2026-03-14 |
| 3. Cronograma + RDO | v1.0 | 3/3 | Complete | 2026-03-13 |
| 4. Orcamento + Compras + Medicoes | 1/5 | In Progress|  | - |
| 5. Relatorios + Dashboards | v1.1 | 0/2 | Not started | - |
