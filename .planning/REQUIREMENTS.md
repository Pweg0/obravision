# Requirements: ProjetaPro

**Defined:** 2026-03-13
**Core Value:** Colaboracao visual sobre projetos de obra com comentarios ancorados, versionamento de plantas e integracao campo-escritorio

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Onboarding

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in with Google OAuth
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User can reset password via email link
- [x] **AUTH-05**: User completes onboarding wizard (create empresa > create obra > invite equipe)

### Gestao de Obras

- [x] **OBRA-01**: User can create, edit, and archive obras with status and progress
- [x] **OBRA-02**: User can invite members with roles (admin, engenheiro, cliente)
- [x] **OBRA-03**: User can set obra details (endereco, tipo, area construida)

### Plantas & Viewer

- [x] **PLNT-01**: User can upload plantas in PDF format
- [x] **PLNT-02**: User can view plantas in full-screen PDF viewer with zoom and navigation
- [x] **PLNT-03**: User can create new plant revisions (R0, R1, R2...) with changelog
- [x] **PLNT-04**: User can click on any point of a planta to create an anchored comment with pin and thread
- [x] **PLNT-05**: User receives real-time notifications when new comments are added via WebSocket

### Cronograma

- [x] **CRON-01**: User can create tasks with start/end date, responsavel, status, and parent stage
- [x] **CRON-02**: User can view and edit interactive Gantt chart with task dependencies
- [x] **CRON-03**: System alerts user when weather forecast predicts rain for climate-sensitive tasks

### Diario de Obra (RDO)

- [x] **RDO-01**: User can create daily diary entry with text, photos, and weather of the day
- [x] **RDO-02**: System auto-detects active task and pre-fills diary entry
- [x] **RDO-03**: System calculates real progress vs planned by cross-referencing diary with schedule

### Orcamento

- [ ] **ORC-01**: User can search and select SINAPI codes for budget items
- [ ] **ORC-02**: User can build budget by obra stage with quantities and unit costs
- [ ] **ORC-03**: User can configure and apply BDI (Beneficios e Despesas Indiretas) to budget
- [ ] **ORC-04**: User can view budget in cost view and sales view
- [ ] **ORC-05**: User can generate commercial proposal (proposta comercial) from budget in 2 clicks
- [ ] **ORC-06**: User can view Curva ABC de insumos (materials ranked by cost impact)

### Compras & Estoque

- [ ] **COMP-01**: User can create purchase requests (solicitacoes de compra) with approval workflows
- [ ] **COMP-02**: User can create supplier quotes with comparative map (mapa comparativo)
- [ ] **COMP-03**: User can generate purchase orders integrated with budget
- [ ] **COMP-04**: User can track inventory per obra linked to purchases
- [ ] **COMP-05**: User can manage multiple storage locations (depositos) per obra or empresa
- [ ] **COMP-06**: User can view real material costs consumed per obra

### Medicoes

- [ ] **MED-01**: User can record physical progress measurements per obra stage
- [ ] **MED-02**: User can record contract measurements with subcontractors (empreiteiros)

### Relatorios & Dashboards

- [ ] **REL-01**: User can view management report (evolution, costs, payments, photos)
- [ ] **REL-02**: User can view key indicators dashboard per obra
- [ ] **REL-03**: User can export obra report as PDF

### Marketing

- [x] **MKT-01**: Public landing page with lead capture form and product showcase

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Financeiro

- **FIN-01**: User can record payments and receivables per obra
- **FIN-02**: User can import XML from Nota Fiscal
- **FIN-03**: User can issue boletos bancarios with automatic notification
- **FIN-04**: User can reconcile bank statements via OFX import
- **FIN-05**: User can view cash flow and DRE (Caixa and Competencia regimes)

### Comercial

- **COM-01**: User can manage sales pipeline in Kanban view integrated with budget
- **COM-02**: System auto-adjusts values by INCC, CUB, IGPM, and IPCA indices
- **COM-03**: User can track inadimplencia (overdue payments)

### Cronograma Avancado

- **CRNA-01**: User can view cronograma fisico-financeiro integrated with budget
- **CRNA-02**: User can export Gantt to PDF, Excel, and MS Project format

### Relatorios Avancados

- **RELA-01**: Unified report center across all modules
- **RELA-02**: User can favorite reports for quick access
- **RELA-03**: Dashboard comercial
- **RELA-04**: Dashboard de compras
- **RELA-05**: Consolidated view across multiple simultaneous obras

### IA & Compliance

- **IA-01**: AI-assisted NBR compliance checking via Claude API
- **IA-02**: Compliance report with OK/Atencao/Nao Conforme status per item
- **IA-03**: Editable checklist for local regulations

### Mobile

- **MOB-01**: Mobile app with login and obra listing
- **MOB-02**: Camera integration for diary photos
- **MOB-03**: Offline mode with sync when reconnected
- **MOB-04**: Push notifications for weather and comments

### Portal & Enterprise

- **ENT-01**: Client portal (read-only link for clients to track obra)
- **ENT-02**: Multi-empresa support (multiple CNPJs)
- **ENT-03**: Public API for ERP integrations (Sienge, Totvs)
- **ENT-04**: SSO (Google Workspace, Azure AD)
- **ENT-05**: Contract management with subcontractors (PDF signing, service measurements)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat between users | WhatsApp already serves this purpose; high complexity, low incremental value |
| Video posts/streaming from construction site | Storage/bandwidth costs disproportionate to value |
| Desktop native app | Web-first is sufficient for target audience |
| Reproducing NBR text | ABNT copyright — use parameterized checklists only |
| Full ERP (HR, payroll, accounting) | Not core to construction management; integrate with existing ERPs via API |
| BIM/3D model viewer | Extremely complex, different target market segment |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| OBRA-01 | Phase 1 | Complete |
| OBRA-02 | Phase 1 | Complete |
| OBRA-03 | Phase 1 | Complete |
| MKT-01 | Phase 1 | Complete |
| PLNT-01 | Phase 2 | Complete |
| PLNT-02 | Phase 2 | Complete |
| PLNT-03 | Phase 2 | Complete |
| PLNT-04 | Phase 2 | Complete |
| PLNT-05 | Phase 2 | Complete |
| CRON-01 | Phase 3 | Complete |
| CRON-02 | Phase 3 | Complete |
| CRON-03 | Phase 3 | Complete |
| RDO-01 | Phase 3 | Complete |
| RDO-02 | Phase 3 | Complete |
| RDO-03 | Phase 3 | Complete |
| ORC-01 | Phase 4 | Pending |
| ORC-02 | Phase 4 | Pending |
| ORC-03 | Phase 4 | Pending |
| ORC-04 | Phase 4 | Pending |
| ORC-05 | Phase 4 | Pending |
| ORC-06 | Phase 4 | Pending |
| COMP-01 | Phase 4 | Pending |
| COMP-02 | Phase 4 | Pending |
| COMP-03 | Phase 4 | Pending |
| COMP-04 | Phase 4 | Pending |
| COMP-05 | Phase 4 | Pending |
| COMP-06 | Phase 4 | Pending |
| MED-01 | Phase 4 | Pending |
| MED-02 | Phase 4 | Pending |
| REL-01 | Phase 5 | Pending |
| REL-02 | Phase 5 | Pending |
| REL-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
