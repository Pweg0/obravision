# Feature Research

**Domain:** Construction management SaaS — Brazilian market (construtoras medias, incorporadoras regionais, engenheiros autonomos)
**Researched:** 2026-03-13
**Confidence:** MEDIUM-HIGH (verified against multiple Brazilian and global sources; some market-specific claims rely on secondary research)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. These are universal across the competitive landscape (Sienge, Obra Prima, Mais Controle, Procore, Fieldwire, Buildertrend).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cadastro de obras com membros e roles | Entire category assumes project-scoped access control. Engineers expect to invite field teams and clients with different permissions. | MEDIUM | Role granularity matters: admin, engenheiro, mestre, cliente. Billing per obra (not per user) is an ObraVision differentiator, but RBAC within obra is still expected. |
| Upload e visualizacao de plantas PDF | The primary artifact of construction work is the plant PDF. Every competing product (PlanGrid, Fieldwire, Procore, Autodesk Build) is built around this. Brazilian engineers receive plants as PDFs from AutoCAD/Revit export. | HIGH | Large files (>50MB) are common. Server-side rendering/conversion is required. pdf.js is viable for viewer; server conversion for performance. |
| Diario de obra (RDO) | Relatório Diário de Obra is a formal industry requirement in Brazil. Entire dedicated SaaS products exist just for RDO (RDOWeb, Kartado, diariodeobras.net). Any obra management product without RDO is non-starter. | MEDIUM | Must include: date, weather record, workers present, activities, materials received, incidents. Photo attachment is expected. |
| Cronograma de tarefas (lista com status) | Most basic planning primitive. Even simple tools (Mais Controle) include task lists with status and responsible party. | LOW | Table view + status (Nao iniciado / Em andamento / Concluido) is baseline. Gantt is a step up but not required for MVP. |
| Controle financeiro basico (orcamento vs realizado) | 79% of Brazilian construction companies cite cost unpredictability as their #1 productivity killer (Deloitte, cited by Mais Controle). Obra Prima's breakout feature is "saiba se lucrou antes de terminar a obra." Every product in the market addresses this. | HIGH | Budget vs. actual per category (material, labor, equipment). Not a full ERP — just tracking planned vs spent. SINAPI integration is a differentiator, not table stakes. |
| Fotos de obra com registro | Engineers and field teams document everything photographically. WhatsApp is the current solution — meaning even a basic photo upload beats the status quo. | LOW | Photo + caption + date + location (GPS optional). Link to task or RDO entry. |
| Notificacoes (email ou push) | Users expect to be alerted when something changes on their project. Assignment notifications, comment replies, status changes. | MEDIUM | WebSocket for real-time is a quality-of-life upgrade. Email fallback is the minimum. |
| Autenticacao e gestao de conta | Self-evident. Email/senha + OAuth (Google) covers 95% of the target audience. | LOW | Google OAuth critical for engenheiros autonomos who work from Gmail. |
| App mobile funcional | Field teams operate on smartphones at construction sites. Desktop-only products are non-starters for field use. Fieldwire, Obra Prima, and all major players have mobile apps. | HIGH | iOS + Android. Even basic photo + RDO + task status update from field satisfies the core need. Offline sync is a strong differentiator (see below). |
| Exportacao de relatorio PDF | Engenheiros entregam RDOs e relatorios para clientes e fiscais. "Imprimir" is a workflow they understand and clients/authorities expect. | MEDIUM | RDO PDF, cronograma PDF, relatorio de obra PDF. Template consistency matters for professional credibility. |
| Onboarding rapido (<5 min) | Brazilian construction engineers are conservative technology adopters. Resistance to change is the #1 adoption barrier (academic research confirms this). Setup complexity is a deal-breaker. | MEDIUM | Wizard-style: empresa → obra → equipe. Pre-filled examples or templates reduce friction significantly. |

---

### Differentiators (Competitive Advantage)

Features that set ObraVision apart. Not expected by users, but create switching costs and word-of-mouth. These align directly with the core value proposition.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Comentarios ancorados na planta (pins + threads) | **No Brazilian competitor offers this.** Current workflow: engineer screenshots plant, circles area in WhatsApp, sends message. ObraVision replaces this with a traceable, searchable, contextual thread pinned to the exact element. Bluebeam Revu exists globally but is desktop-only and expensive. | HIGH | Requires PDF viewer with coordinate mapping, pin persistence against plant versions, thread UI. The core technical moat of the product. PDF.js + canvas overlay + pin-to-coordinate storage. Pins must survive plant revisions (coordinate normalization required). |
| Versionamento de plantas (R0, R1, R2) com historico | Revision tracking is a known pain point. Engineers receive updated plants and lose track of which version field teams are using. Fieldwire does this in the US market but no Brazilian product does it well. | HIGH | "Superseded" tagging of old revisions. Automatic notification to team when new revision uploaded. Old pins from previous revision must be either carried forward (with migration prompt) or archived. This is a strong complement to anchored comments. |
| Cronograma Gantt com alerta de clima integrado | Weather is the leading cause of construction schedule delays (rain floods sites, prevents concrete pouring, makes crane operation unsafe). No Brazilian software integrates weather into scheduling. The closest is manual RDO weather logging. | HIGH | Requires weather API integration (Open-Meteo is free, INMET for Brazil-specific data). Alert logic: "Chuva prevista para amanha — tarefas 12, 13, 15 podem ser afetadas." Integrate with Gantt critical path to flag at-risk tasks. |
| Checagem NBR assistida por IA | No competitor in Brazil offers AI-powered NBR compliance checking. Sienge and TOTVS address compliance procedurally, not with AI assistance. The 881 NBR standards for civil construction create real cognitive load for engineers on mid-size projects. | HIGH | Uses Claude API. Scope: checklist-based (not reproducing ABNT text — copyright). User describes element/situation, AI maps to applicable NBR checklist items. Permanent legal disclaimer: "analise assistiva, nao substitui laudo tecnico." Cost risk: Claude API per-call — must be gated behind Pro/Business plan with rate limits. |
| Portal do cliente (link externo read-only) | Clients (proprietarios, incorporadoras) want visibility without being added as full project members. Buildertrend does this in the US; no Brazilian product does it cleanly. Reduces "como ta minha obra?" WhatsApp messages. | MEDIUM | Public link or invite-only portal showing: cronograma atual, fotos recentes, ultimo RDO, progresso financeiro. No editing. Optionally password-protected. |
| Modo offline no app mobile com sync | Construction sites in Brazil often have poor connectivity (obras em areas remotas, basements, steel structures that block signal). Fieldwire's offline mode is a key differentiator in the US market. Brazilian competitors have weak or no offline support. | HIGH | Service worker + local SQLite (or IndexedDB for PWA, or SQLite for React Native). Sync queue for photos, RDO entries, task updates. Conflict resolution strategy required (last-write-wins is acceptable for MVP). |
| SINAPI integration para orcamento | SINAPI (Sistema Nacional de Pesquisa de Custos e Indices da Construcao Civil) is the government-maintained price index for construction in Brazil. Vobi has this; most others don't. Engineers building budgets from scratch vs. pulling live SINAPI compositions is a 10x productivity difference. | HIGH | Requires SINAPI API (CAIXA provides data; parsing is complex). Initial implementation can be CSV import of SINAPI tables with periodic refresh. Full API integration is v2+. |
| Templates de obras por tipo (residencial, comercial, reforma) | Reduces time-to-first-value dramatically. An engenheiro autonomo starting a new residential project shouldn't configure everything from scratch. | MEDIUM | Pre-built cronograma templates, RDO field presets, checklist templates by project type. Reduces onboarding friction. |
| Programa de indicacao | SaaS growth mechanic appropriate for this market. Brazilian SMB software companies (Conta Azul, NF-e, etc.) have used referral programs effectively. | LOW | Referral link generation, tracking, and reward (free month, trial extension). Low complexity, high leverage for solo-dev growth. |

---

### Anti-Features (Deliberately NOT Building)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Chat em tempo real entre usuarios | Engineers want to "replace WhatsApp" with one tool. Seems like a natural extension of comments and notifications. | Chat requires presence indicators, read receipts, message history, thread management, push notification infra, and moderation concerns. It's a product unto itself. And WhatsApp already works. Zero chance of winning on chat UX against WhatsApp. | Anchored comment threads + @mention notifications. For urgent comms, engineers will use WhatsApp — and that's fine. ObraVision handles the structured, traceable communication layer. |
| Video streaming / timelapse de obra | Timelapse cameras are a real product category (Foco Avanco uses them). "Ver a obra ao vivo" is a client-pleasing feature request. | Storage and bandwidth costs are disproportionate to value. A 30-day timelapse at 1 frame/minute = gigabytes of storage per obra. Video transcoding requires dedicated infra. | Daily photo uploads in RDO + photo gallery per obra give 90% of the value at 1% of the cost. Timelapse integrations can be a v3 partnership, not a built feature. |
| App desktop nativo (Electron, Tauri) | Some engineers have corporate laptops and want a "proper app." | Desktop native app doubles platform maintenance burden for a solo dev. Web app with PWA install covers the use case. Existing tools (Sienge, TOTVS) are heavy desktop apps — being web-first is an advantage, not a limitation. | PWA (Progressive Web App) installable from browser. Offline-capable. No app store friction. |
| Reproducao de texto das normas NBR | Building an "NBR library" in the product seems like added value. | ABNT holds copyright on NBR text. Reproducing normative content creates legal exposure. Confirmed in PROJECT.md constraints. | AI checklist approach: describe the requirement in natural language ("paredes corta-fogo devem ter..."), surface it as a checklist item with reference code ("NBR 11711"), without reproducing the normative text. |
| Gestao de RH e folha de pagamento | Construtoras ask for "tudo em um lugar" including employee management, timesheet, payroll. | Full HR/payroll is a regulated domain (eSocial integration, CLT rules, FGTS calculations). It's a separate product category. Adding it creates legal and compliance burden for the dev team. | Integrate with existing payroll tools (Gupy, Totvs RH) via API. Track "workers present" in RDO (headcount) without becoming a payroll system. |
| ERP completo (NF-e, compras, estoque profundo) | Mid-size construtoras want everything integrated. Sienge is the benchmark for full ERP. | Competing with Sienge on ERP completeness is a trap. Sienge has 30+ years of development and is used by 74 of the 100 largest Brazilian construtoras. Winning on ERP features is impossible for a solo dev. | Win on collaboration UX (comments on plants, versioning, client portal). API publica para integracao com ERPs lets power users connect ObraVision to Sienge/TOTVS for financial data. |
| BIM 3D viewer integrado | Engineers working with BIM models (Revit, Archicad) want 3D visualization. | BIM viewing requires specialized renderers (IFC.js, Autodesk Viewer). The target market (engenheiros autonomos, construtoras medias) works primarily with 2D PDFs, not BIM models. BIM adoption in this segment is low. | Stay in 2D PDF space. If BIM becomes a requirement, it's a v3+ feature or partnership with Autodesk/BIM 360. |

---

## Feature Dependencies

```
[Autenticacao + RBAC]
    └──requires──> [CRUD de obras com membros]
                       └──enables──> [Todos os outros features]

[Upload de plantas PDF]
    └──enables──> [Comentarios ancorados em plantas]
                       └──requires──> [Versionamento de plantas]
                                          └──enables──> [Pin migration entre revisoes]

[Cronograma de tarefas]
    └──enables──> [Gantt basico]
                       └──enables──> [Gantt com dependencias + caminho critico]
                                          └──enhances──> [Alerta de clima integrado ao Gantt]

[Diario de obra (RDO)]
    └──enables──> [Exportacao de relatorio PDF]
    └──enhances──> [Cronograma] (via registro de avancos diarios)
    └──enhances──> [Alerta de clima] (clima registrado no RDO alimenta historico)

[App mobile]
    └──requires──> [Autenticacao]
    └──enhances──> [Diario de obra] (fotos e camera nativa)
    └──enables──> [Modo offline] (offline so existe no contexto mobile)

[Checagem NBR por IA]
    └──requires──> [Claude API integration]
    └──requires──> [Billing/planos] (deve estar atras de paywall Pro/Business)
    └──conflicts──> [Reproducao texto NBR] (risco legal, usar apenas checklists)

[Portal do cliente]
    └──requires──> [CRUD de obras]
    └──requires──> [Cronograma]
    └──requires──> [Fotos de obra]
    └──does NOT require──> [Full auth system] (link externo read-only)

[Billing (Stripe)]
    └──enables──> [Planos Free/Pro/Business]
    └──gates──> [Checagem NBR por IA] (Pro+)
    └──gates──> [Modo offline] (Pro+)
    └──gates──> [Portal do cliente] (Pro+)
```

### Dependency Notes

- **Comentarios ancorados requires Versionamento de plantas:** Pins are stored with plant coordinates. When a new revision is uploaded, existing pins must be migrated or archived — this logic must be designed before implementing comments at scale.
- **Gantt com alerta de clima requires Cronograma de tarefas:** The weather alert system overlays on task schedule. Tasks need date ranges and types (outdoor/indoor) to determine weather sensitivity.
- **Checagem NBR requires Billing gates:** Claude API cost per call makes this unsustainable on the Free plan. Rate limiting and plan-gating must be built before enabling NBR checking broadly.
- **Modo offline conflicts with Real-time sync:** Offline-first architecture (optimistic updates, conflict resolution) must be designed upfront. Bolting offline onto a real-time-first architecture causes data integrity issues.

---

## MVP Definition

### Launch With (v1 — Weeks 1-8)

Minimum viable product to put in front of beta engenheiros and validate core value.

- [ ] Autenticacao (email/senha + Google OAuth) — without auth, nothing else works
- [ ] CRUD de obras com convite de membros e roles — the organizing unit of everything
- [ ] Upload e visualizacao de plantas PDF (R0 baseline) — the primary artifact
- [ ] Comentarios ancorados em plantas (pins + threads) — the core differentiator, validate immediately
- [ ] Diario de obra (RDO) com fotos — table stakes for Brazilian engineers, validates daily active use
- [ ] Cronograma basico de tarefas — needed to make RDO meaningful (connect tasks to progress)
- [ ] Notificacoes em tempo real (WebSocket) — without this, collaboration feels dead
- [ ] Landing page + onboarding 3 passos — required for self-serve acquisition
- [ ] Billing basico (Free tier + Pro trial 14 dias) — validates willingness to pay before building more

### Add After Validation (v1.x — Weeks 9-16)

Add once core collaboration flow is validated with beta users.

- [ ] Versionamento de plantas (R1, R2...) — when beta users start uploading revised plants
- [ ] Cronograma Gantt com dependencias — when users outgrow task lists
- [ ] Exportacao de relatorio PDF — when users ask "como eu mostro isso pro cliente?"
- [ ] Portal do cliente (read-only link) — when users report "meu cliente quer ver a obra"
- [ ] App mobile basico (RDO + camera + tarefas) — when field teams join beta

### Future Consideration (v2+ — After Product-Market Fit)

Defer until clear evidence these are activation/retention drivers.

- [ ] Alerta de clima integrado ao Gantt — high value but requires weather API integration + Gantt dependency logic
- [ ] Checagem NBR por IA — high complexity + API cost; build after revenue validates Pro tier
- [ ] Modo offline no app mobile — high complexity; defer until mobile DAU justifies investment
- [ ] SINAPI integration — high value for budgeting workflow; add when financial module matures
- [ ] Multi-empresa (multiplos CNPJs) — for construtoras com multiplas filiais; not relevant for engenheiros autonomos
- [ ] API publica para integracao com ERPs — enterprise feature; after Business tier has traction
- [ ] SSO (Google Workspace, Azure AD) — enterprise feature; requires compliance work
- [ ] Gestao de contratos com prestadores — adds legal workflow complexity; validate demand first
- [ ] Programa de indicacao — growth mechanic; implement after retention baseline established

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Comentarios ancorados na planta | HIGH | HIGH | P1 — core differentiator, validate first |
| Upload + viewer de plantas PDF | HIGH | HIGH | P1 — prerequisite for everything visual |
| Diario de obra (RDO) com fotos | HIGH | MEDIUM | P1 — table stakes for Brazilian engineers |
| Autenticacao + obras + membros | HIGH | LOW | P1 — foundational infrastructure |
| Cronograma basico de tarefas | HIGH | LOW | P1 — basic planning primitive |
| Notificacoes em tempo real | MEDIUM | MEDIUM | P1 — required for collaboration feel |
| Versionamento de plantas | HIGH | HIGH | P2 — natural extension of upload feature |
| Exportacao PDF de relatorio | HIGH | MEDIUM | P2 — client-facing deliverable |
| Portal do cliente | MEDIUM | MEDIUM | P2 — reduces "como ta a obra?" interruptions |
| App mobile (RDO + camera) | HIGH | HIGH | P2 — field access critical for daily use |
| Gantt com dependencias | MEDIUM | HIGH | P2 — power users need it |
| Alerta de clima no Gantt | MEDIUM | HIGH | P2 — differentiator, add after Gantt matures |
| Checagem NBR por IA | HIGH | HIGH | P2 — high WTP, high complexity |
| Modo offline mobile | HIGH | HIGH | P2 — required for field use in poor connectivity areas |
| SINAPI integration | MEDIUM | HIGH | P3 — high value but scope creep risk |
| Multi-empresa | LOW | MEDIUM | P3 — enterprise, not v1 audience |
| API publica / ERP integration | LOW | HIGH | P3 — enterprise, defer |
| SSO | LOW | MEDIUM | P3 — enterprise, defer |
| Programa de indicacao | MEDIUM | LOW | P3 — growth mechanic, after retention proven |
| Templates de obras | MEDIUM | LOW | P2 — reduces onboarding friction significantly |

**Priority key:**
- P1: Must have for launch — without these, no beta makes sense
- P2: Should have — add during validation phase or immediately after
- P3: Nice to have — future consideration, defer without regret

---

## Competitor Feature Analysis

| Feature | Sienge | Obra Prima | Mais Controle | Fieldwire (global) | ObraVision Approach |
|---------|--------|------------|---------------|-------------------|---------------------|
| Upload e viewer de plantas | Partial (document storage) | No viewer | No viewer | YES (core feature) | YES + pins ancorados |
| Comentarios ancorados na planta | NO | NO | NO | Basic markup | YES — core differentiator |
| Versionamento de plantas | NO | NO | NO | YES | YES — R0/R1/R2 system |
| Diario de obra (RDO) | YES | YES (destaque) | YES | YES | YES |
| Cronograma / Gantt | YES (ERP) | YES (basico) | YES (basico) | YES | YES + Gantt com clima |
| Controle financeiro | YES (full ERP) | YES (orcado vs realizado) | YES | NO | BASICO (nao ERP) |
| Alerta de clima | NO | NO | NO | NO | YES — diferencial |
| Checagem NBR por IA | NO | NO | NO | NO | YES — diferencial |
| Portal do cliente | NO | NO | NO | YES | YES |
| App mobile offline | NO | Parcial | NO | YES | YES (diferencial no Brasil) |
| SINAPI integration | Parcial | NO | NO | NO | v2+ diferencial |
| Preco por obra (nao por usuario) | NO — por usuario | NO — por usuario | NO — por usuario | NO — por usuario | YES — diferencial de modelo |
| Onboarding simples (<5 min) | NO — implementacao complexa | MEDIO | MEDIO | NO | YES — constraint critica |

**Key insight:** No Brazilian competitor offers visual collaboration on blueprints (anchored comments + versioning). Fieldwire does this in the US/global market but is expensive ($54+/user/month) and not localized for Brazil (no Portuguese, no NBR, no SINAPI, no Real-based pricing). ObraVision's moat is the combination of visual collaboration + Brazilian localization.

---

## Sources

- [Blog Obra Prima — 14 melhores softwares de gestao de obras](https://blog.obraprima.eng.br/12-melhores-de-softwares-de-gestao-de-obras/)
- [Top 10 Apps de Gestao de Obras para 2025 — Plataforma de Obras](https://www.plataformadeobras.com.br/blog/top-15-apps-de-gestao-de-obras-para-2025-brasil/)
- [Sienge — Software de gestao de obras](https://sienge.com.br/blog/software-de-gestao-de-obras/)
- [Mais Controle — Melhores softwares de gestao de obras](https://maiscontroleerp.com.br/quais-sao-os-melhores-softwares-de-gestao-de-obras/)
- [Focoenobra — 10 melhores softwares para construtoras 2026](https://focoenobra.com/pt-br/blog/10-melhores-softwares-para-construtoras/)
- [Vobi — Tabela SINAPI integrada ao orcamento](https://www.vobi.com.br/funcionalidades/tabela-sinapi-orcamento-de-obra)
- [Fieldwire — Blueprint app](https://www.fieldwire.com/lp/blueprint-app/)
- [Pivotly — Construction Plan Comparison & Document Revision Control](https://pivotly.com/construction-plan-comparison-document-revision-control/)
- [Buildern — Construction Client Portal](https://buildern.com/features/construction-client-portal)
- [GetApp — Construction Management Software with Offline Access 2025](https://www.getapp.com/construction-software/construction-management/f/offline-access/)
- [Kartado — Relatorio Diario de Obra (RDO)](https://kartado.com.br/relatorio-diario-de-obra-rdo/)
- [RDOWeb — Diario de Obra em nuvem](https://rdoweb.com.br/)
- [Frontiers in Built Environment — Barriers to BIM Adoption in Brazil](https://www.frontiersin.org/journals/built-environment/articles/10.3389/fbuil.2021.520154/full)
- [NBR normas ABNT — principais normas construcao civil (Mobuss)](https://www.mobussconstrucao.com.br/blog/abnt-construcao-civil/)
- [SelectHub — PlanGrid vs Fieldwire 2025](https://www.selecthub.com/construction-management-software/plangrid-vs-fieldwire/)
- [Zipboard — Blueprint Markup Software](https://zipboard.co/blog/aec/blueprint-markup-software/)
- [VisualCrossing — Weather-Driven Construction Scheduling](https://www.visualcrossing.com/resources/blog/weather-driven-construction-project-scheduling-for-safer-smarter-job-sites/)

---

*Feature research for: Construction management SaaS — Brazilian market (ObraVision)*
*Researched: 2026-03-13*
