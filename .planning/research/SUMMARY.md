# Project Research Summary

**Project:** ProjetaPro — Construction Management SaaS (Brazil)
**Domain:** Visual collaboration on construction blueprints, Brazilian civil engineering market
**Researched:** 2026-03-13
**Confidence:** HIGH (stack, architecture, pitfalls) / MEDIUM-HIGH (features, market positioning)

## Executive Summary

ProjetaPro is a construction management SaaS targeting Brazilian mid-size construtoras, incorporadoras regionais, and engenheiros autonomos. Research confirms that no Brazilian competitor offers anchored visual commenting on PDF blueprints — the closest global analog is Fieldwire, which is expensive, unlocalized, and has no NBR or SINAPI integration. The product's technical moat is the combination of visual PDF collaboration (pins + threads on plant revisions) with Brazilian market localization (RDO, SINAPI, NBR compliance, Pix billing, LGPD compliance, Portuguese UX). The recommended architecture is a pnpm/Turborepo monorepo hosting a Next.js 15 web app on Vercel, a Fastify 5 API on Railway with Socket.io and BullMQ, PostgreSQL 16 with row-level security for multi-tenancy, Cloudflare R2 for PDF/photo storage, and Expo SDK 53 for the React Native mobile app.

The development sequence is strictly constrained by dependencies: multi-tenant foundation and auth must come before everything, the PDF pipeline must work before annotations can exist, REST routes must stabilize before WebSocket collaboration is layered on, and billing must be implemented before AI features (Claude API cost control depends on plan-gating). The core value prop — pins on blueprints — must be shippable and demoable with real beta users within 8 weeks; any later and conservative-adopter engineers will return to WhatsApp.

The top risks are scope creep killing the MVP before launch (explicitly identified as a pitfall), silent cross-tenant data leakage from incomplete RLS policies, PDF.js memory exhaustion on large engineering drawings on Android devices, orphaned annotation coordinates after PDF version upgrades, and Claude API cost runaway if NBR checks are not gated behind billing and cached aggressively. All five of these risks are preventable by design decisions in Phase 1 and Phase 2 — they cannot be retrofitted safely.

---

## Key Findings

### Recommended Stack

The stack is a Node.js-native monorepo with clear separation between the web frontend (Next.js 15, App Router, tRPC for internal calls, TanStack Query v5, Zustand), the API server (Fastify 5, standalone persistent process for Socket.io and BullMQ workers, Zod schemas, Auth.js v5, Stripe webhooks), and the mobile app (Expo SDK 53, WatermelonDB for offline SQLite sync). PostgreSQL 16 with Prisma 5 handles persistent data; Redis 7 is required for both BullMQ job queuing and Socket.io cross-instance broadcasting. PDF rendering uses react-pdf (PDF.js) on the client with an SVG overlay for annotation pins; server-side conversion uses @hyzyla/pdfium + sharp to pre-render large PDFs to WebP tiles before sending to clients. Cloudflare R2 wins decisively over S3 on zero-egress costs for a PDF-heavy app.

**Core technologies:**
- **Next.js 15 (App Router):** Web frontend — React 19 + Turbopack, Server Components, tRPC integration
- **Fastify 5:** Persistent API server — Socket.io host, BullMQ workers, Stripe webhooks; cannot be serverless
- **PostgreSQL 16 + Prisma 5:** Primary database with RLS for tenant isolation; Prisma Studio accelerates solo-dev iteration
- **Redis 7 + BullMQ 5:** Job queue (PDF processing, AI calls, email, weather) and Socket.io scaling adapter
- **Socket.io 4:** Real-time WebSocket layer, room-per-obra model, Redis adapter for horizontal scale
- **Expo SDK 53 + WatermelonDB:** React Native mobile, offline-first SQLite with sync protocol
- **Cloudflare R2:** PDF and photo storage, zero egress fees; decisive for a PDF-heavy bootstrapped product
- **Auth.js v5:** Email/password + Google OAuth, Prisma adapter, httpOnly JWT cookies
- **Stripe (latest) + Pix Automatico:** Billing with metered obra-count model; Pix Automatico for recurring BRL subscriptions
- **Anthropic SDK (Claude):** AI-assisted NBR compliance checks, BullMQ-queued, prompt-cached, plan-gated
- **react-pdf + react-pdf-highlighter:** Browser PDF viewer with coordinate-preserving annotation overlay
- **@hyzyla/pdfium + sharp:** Server-side PDF-to-WebP tile conversion for large files

**Critical version constraints:** tRPC v11 required for TanStack Query v5 compatibility (v10 does not work); Auth.js v5 required for Next.js 15 App Router (v4 had App Router issues); WatermelonDB must use the Expo Config plugin — do not manually link; verify Prisma major version at project start (Prisma 6 removes Rust engine, released late 2025).

### Expected Features

**Must have (table stakes) — launch blockers:**
- Cadastro de obras with member invite and RBAC (admin, engenheiro, mestre, cliente roles)
- Upload and viewer for plant PDFs (large files, >50MB common; server-side conversion required)
- Diario de obra / RDO with photo attachment (formal industry requirement; products without RDO are non-starters)
- Cronograma basico de tarefas with status tracking
- Controle financeiro (orcado vs realizado per category; not full ERP)
- Real-time notifications (WebSocket events; email fallback minimum)
- Authentication (email/password + Google OAuth; Google critical for Gmail-native engenheiros)
- Mobile app (iOS + Android; field teams are on smartphones)
- PDF report export (RDO and cronograma; clients and fiscais expect PDFs)
- Onboarding under 5 minutes (conservative adopters; complexity is the primary rejection reason)

**Should have (competitive differentiators) — unique in Brazilian market:**
- Comentarios ancorados na planta (pins + threads at exact coordinates) — no Brazilian competitor offers this; the core moat
- Versionamento de plantas (R0/R1/R2 with pin migration) — complements anchored comments; also unique in Brazil
- Cronograma Gantt with weather alert integration — no Brazilian product integrates weather into scheduling
- Portal do cliente (read-only shared link) — reduces "como ta minha obra?" WhatsApp interruptions
- Modo offline no app mobile with sync — Brazilian construction sites have poor connectivity; Fieldwire's offline mode is a US market differentiator ProjetaPro can own in Brazil
- Checagem NBR assistida por IA — Claude API; no competitor offers this; high willingness-to-pay from engineers

**Defer to v2+:**
- SINAPI integration for budgeting (high value; complex CAIXA API parsing; CSV import is acceptable bridge)
- Multi-empresa / multi-CNPJ (enterprise feature; irrelevant for engenheiros autonomos)
- Public ERP API (enterprise; after Business tier has traction)
- SSO (Google Workspace/Azure AD) — enterprise procurement requirement; not needed at MVP
- Programa de indicacao — growth mechanic; implement after retention baseline established
- Alerta de clima integrado ao Gantt (depends on Gantt dependency logic being mature)

**Deliberate anti-features:**
- No real-time chat (WhatsApp already works; ProjetaPro handles structured/traceable communication)
- No video/timelapse (storage costs disproportionate; daily RDO photos cover 90% of value)
- No desktop native app (web PWA covers the use case; web-first is the competitive advantage)
- No NBR text reproduction (ABNT copyright; AI checklist approach avoids legal exposure)
- No HR/payroll (regulated domain; eSocial/CLT complexity is a separate product category)

### Architecture Approach

ProjetaPro uses a layered monorepo architecture: Next.js web app (client layer) communicates via tRPC over HTTPS and WebSocket to a Fastify API server (API layer), which coordinates background workers via BullMQ (background layer) and persists data to PostgreSQL + Redis + Cloudflare R2 (data layer). The React Native mobile app communicates only via REST to the same Fastify API, with WatermelonDB providing offline SQLite storage. All tenants share a single PostgreSQL schema with row-level security enforcing data isolation — database-per-tenant is explicitly rejected as operationally unmanageable for a solo dev. Annotation pins are stored as normalized 0.0–1.0 coordinates (not canvas pixels) in PostgreSQL, rendered as an SVG overlay layer on top of the PDF.js canvas. The WebSocket hub uses a room-per-obra model; Socket.io Redis adapter enables broadcasting across multiple API instances when scaling.

**Major components:**
1. **Web App (Next.js 15)** — PDF viewer with annotation overlay, project management UI, real-time presence
2. **API Server (Fastify 5)** — REST endpoints, WebSocket hub, auth, multi-tenant RLS enforcement, billing gates
3. **Background Workers (BullMQ)** — PDF conversion, weather cron, AI NBR checks, email/push notifications; isolated process
4. **Mobile App (Expo + WatermelonDB)** — offline diary, camera, task status updates; sync via REST
5. **PostgreSQL 16 (RLS)** — persistent data with transparent tenant isolation
6. **Redis 7** — BullMQ broker, Socket.io scaling adapter, API response cache (weather, AI results)
7. **Cloudflare R2** — PDF storage, converted page images (WebP tiles), field photos, exported reports
8. **Client Portal (Next.js, token-gated)** — read-only shared link; no account required; shares Next.js codebase

**Key patterns:**
- REST for mutations (auditable), WebSocket only for low-latency collaboration events (annotation pins, presence toasts, notifications)
- Annotation coordinates as normalized 0.0–1.0 fractions; immutable PDF files; annotations stored in DB as separate records
- Async everything for PDF processing and AI calls (BullMQ queue, 202 Accepted, WebSocket notification when ready)
- RLS enforced via `SET LOCAL app.tenant_id` on every authenticated request; secondary application-layer tenant filter as defense in depth

### Critical Pitfalls

1. **Pin coordinates orphaned after PDF revision upload** — Store normalized 0.0–1.0 coordinates from day one; attach every pin to a specific `pdf_revision_id`, never a mutable "current" pointer; never auto-migrate coordinates across revisions. Schema must be correct before the first pin is stored — retrofitting requires a full migration.

2. **Multi-tenant data leakage via incomplete RLS** — Enable RLS with both `USING` and `WITH CHECK` on every table at creation time; add CI lint rule rejecting tables without RLS; write two-tenant integration test that asserts zero row cross-leakage; use PgBouncer in session mode (not transaction mode); add application-layer tenant filter as defense in depth.

3. **PDF.js memory exhaustion on large drawings on Android** — Only render the current viewport page + 1 ahead; call `page.cleanup()` for pages more than 2 viewport-lengths away; serve PDFs from R2 with `Accept-Ranges: bytes` for byte-range streaming; test specifically on a Moto G-class device with a 50MB PDF before any demo.

4. **LLM cost runaway on NBR compliance checks** — Gate behind Pro/Business plan; enforce per-tenant monthly limits server-side (not client-side); enable Anthropic prompt caching on static NBR system prompt; cache check results in DB for 30 days; use Claude Haiku for simple validation; set Anthropic spending alerts and automatic circuit-breaker.

5. **Solo dev scope creep killing the MVP** — Phase 1 feature list must be locked to: auth, obra CRUD, PDF upload/viewer, pins on PDF, basic RDO. Commit a ship date to beta testers; treat everything else as non-existent until phase boundary review.

---

## Implications for Roadmap

Based on the dependency graph across all four research files, the build order is strictly determined: foundation enables everything; PDF pipeline enables the core differentiator; collaboration layer requires both; billing enables AI; mobile is parallel but lower priority than web validation.

### Phase 1: Foundation + Core Differentiator (MVP)

**Rationale:** Auth, multi-tenancy, RLS, and the PDF viewer with anchored comments are the hard dependencies for everything downstream. The PDF annotation system is both the core differentiator and the highest-risk technical component — it must be validated with real beta users first. Billing is excluded to reduce scope; a 14-day Pro trial satisfies "willingness to pay" validation without building the full billing system.

**Delivers:** A working product where an engenheiro can sign up, create an obra, upload a plant PDF, place pins with comments, invite a team member, and enter a daily RDO — all within 5 minutes from first load.

**Addresses (from FEATURES.md):** Authentication + Google OAuth, obra CRUD with RBAC, PDF upload and viewer, anchored comment pins + threads, basic RDO with photos, basic task list with status, real-time WebSocket notifications, onboarding wizard, Free tier + Pro trial landing page.

**Avoids (from PITFALLS.md):** Pin coordinate schema must be correct (normalized 0.0–1.0 + revision_id FK) from the first commit; RLS with CI enforcement from day one; LGPD Privacy Policy in Portuguese before first user; PDF.js memory management for mobile; Ghostscript AGPL — use PDFium/pdfcpu; onboarding validated with beta engenheiros for <5 min to first pin.

**Research flag:** Standard patterns for auth (Auth.js v5 docs are thorough), multi-tenancy RLS (AWS + Nile blog posts are authoritative), and BullMQ (official docs are complete). PDF annotation overlay is the least-documented custom pattern — verify react-pdf-highlighter maintenance status before adopting; have a fallback plan using raw PDF.js canvas with a custom SVG layer.

---

### Phase 2: Collaboration Depth + Billing + Mobile

**Rationale:** Once the core annotation loop is validated with beta users, the natural next questions are "how do I manage plant revisions?" and "how do I show this to my client?" Billing must enter this phase — validation with beta users answers willingness-to-pay; Stripe + Pix Automatico implementation here enables real revenue. Mobile app (RDO + camera + offline sync) enters when field teams join the beta, which typically happens when the web product has traction.

**Delivers:** Plant versioning with pin attribution to revisions, PDF report export, client portal (read-only shared link), basic Gantt with task dependencies, Stripe billing (Free/Pro/Business with metered obra count and Pix Automatico), and a mobile app covering RDO + camera + task status with offline sync.

**Addresses (from FEATURES.md):** Versionamento de plantas (R0/R1/R2), exportacao de relatorio PDF, portal do cliente, cronograma Gantt basico, billing, app mobile basico, templates de obras por tipo.

**Avoids (from PITFALLS.md):** Pin migration strategy across revisions (design before implementing versioning); offline sync conflict resolution (append-only RDO log, field-level merging for task status, conflict UI surface); Stripe + Pix Automatico — not one-time Pix; metered obra-count billing model (not seat-based); IOF disclosure in pricing.

**Research flag:** Pix Automatico (recurring PIX consent mandate) is a 2025 Stripe feature with limited community documentation — needs deeper research during planning. WatermelonDB sync protocol design (pull/push endpoints, sequence number strategy) will benefit from a focused research pass.

---

### Phase 3: AI Features + Scale + Growth

**Rationale:** AI NBR compliance checks require billing infrastructure (plan-gating, usage counters) to be in place first — building AI before billing creates uncontrolled cost exposure. Weather-Gantt integration requires Gantt dependency logic from Phase 2 to be mature. This phase adds the high-value, high-complexity differentiators that justify Pro/Business pricing.

**Delivers:** AI-assisted NBR compliance checking (Claude API, plan-gated, cached), weather integration with Gantt alerts, SINAPI CSV import for budgeting, performance hardening (annotation lazy loading, N+1 query fixes, CDN caching for R2 page images), referral program.

**Addresses (from FEATURES.md):** Checagem NBR assistida por IA (Pro/Business), alerta de clima integrado ao Gantt, SINAPI integration (CSV import), programa de indicacao, controle financeiro aprofundado.

**Avoids (from PITFALLS.md):** LLM cost runaway — prompt caching, per-tenant monthly limits, Haiku for simple checks, DB result caching (30-day TTL), Anthropic spending alerts and circuit-breaker must all be implemented before enabling NBR checks for any paid user.

**Research flag:** NBR checklist prompt design (what questions to ask Claude, how to structure the system prompt for construction compliance without reproducing ABNT text) is novel territory with no community precedent — will need a dedicated research pass during planning. SINAPI API parsing (CAIXA data format) is underdocumented; CSV import is the safe first implementation.

---

### Phase 4: Enterprise + Integrations

**Rationale:** After product-market fit is established with engenheiros autonomos and construtoras medias, the growth path is enterprise: larger construtoras need SSO, multi-CNPJ support, public API for ERP integration, and advanced compliance features. This phase is deliberately deferred to prevent premature enterprise complexity from slowing MVP iteration.

**Delivers:** Public REST API with OpenAPI spec (Fastify schema-derived), API key authentication for ERP integrations, SSO (Google Workspace / Azure AD), multi-empresa / multi-CNPJ support, full data export for LGPD portability at scale, SLA documentation for enterprise contracts.

**Addresses (from FEATURES.md):** API publica para integracao com ERPs, SSO, multi-empresa, gestao de contratos com prestadores.

**Research flag:** ERP integration targets (Sienge, TOTVS) have limited public API documentation — needs research into what data exchange is actually possible. SSO implementation patterns for Next.js + Auth.js v5 are well-documented (skip research).

---

### Phase Ordering Rationale

- **Foundation before everything:** PostgreSQL schema with RLS cannot be retrofitted safely after data exists. Multi-tenancy is a Phase 1 constraint, not a Phase 2 enhancement.
- **PDF pipeline before annotation UI:** The viewer has no content to display until upload → R2 → BullMQ → pdfium conversion → WebP tiles → DB status update is working end-to-end.
- **REST before WebSocket:** The WS hub depends on project membership data that comes from REST routes. Build REST first, add WS broadcasting as an enhancement on top.
- **Web validation before mobile investment:** PDF annotation is the core differentiator and must be validated on web first. Mobile focuses on RDO + field tasks that don't require the annotation system.
- **Workers before AI:** The BullMQ + Redis infrastructure must exist before any new queue consumer (AI, weather) can be plugged in. AI and weather are just new consumers in an existing system.
- **Billing before AI:** Claude API cost is only controllable behind billing-enforced plan tiers. Do not expose NBR checks without usage counters and monthly limits in place.

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**
- **Phase 1:** react-pdf-highlighter maintenance status and coordinate system compatibility with PDF.js — community-maintained library; verify before building the annotation layer on top of it
- **Phase 2:** Pix Automatico (recurring PIX mandate via Stripe) — 2025 feature with sparse community implementation examples; needs API-level research before billing sprint
- **Phase 2:** WatermelonDB sync protocol design — the sync endpoint contract (pull/push, sequence numbers, conflict detection) is custom; needs a design pass before the first offline commit
- **Phase 3:** NBR compliance prompt engineering — completely novel territory; no community examples of construction compliance AI checklist design; needs research before any Claude integration work begins
- **Phase 3:** SINAPI CAIXA data format — CAIXA's API documentation is limited; CSV import path needs to be verified against actual SINAPI data structures

**Phases with standard patterns (skip research):**
- **Phase 1:** Auth.js v5 with Next.js 15 and Prisma adapter — official docs are thorough and current
- **Phase 1:** PostgreSQL RLS multi-tenancy — AWS official docs + Nile blog provide authoritative implementation guide
- **Phase 1:** BullMQ job queues — official docs cover all required patterns
- **Phase 2:** Stripe subscription billing (non-PIX paths) — official Stripe docs are comprehensive
- **Phase 4:** SSO with Auth.js v5 — well-documented OAuth2/SAML provider patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack choices (Next.js 15, Fastify 5, PostgreSQL, Redis, Expo) are verified against official documentation. Version compatibility matrix tested against official changelogs. Two items are MEDIUM: @hyzyla/pdfium (smaller library, verify maintenance) and react-pdf-highlighter (community-maintained, verify activity). |
| Features | MEDIUM-HIGH | Table stakes verified against 6+ Brazilian competitor products and industry sources. Differentiator claims (no Brazilian product has PDF annotations) are supported by competitor analysis but could shift if a competitor ships. Market size and adoption barrier claims rely on secondary sources. |
| Architecture | HIGH | Multi-tenancy RLS, WebSocket hub, BullMQ job patterns, and offline sync patterns are all verified against official or authoritative secondary sources. Annotation overlay coordinate system is HIGH confidence from construction-industry PDF annotation precedent (PlanGrid). |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (pin coordinate orphaning, RLS leakage, PDF memory, LLM cost) are grounded in documented CVEs, GitHub issues, and official library behavior. Brazilian market-specific pitfalls (LGPD, Pix, conservative adoption) rely on secondary and community sources. |

**Overall confidence:** HIGH for build decisions; MEDIUM-HIGH for market assumptions that need beta validation.

### Gaps to Address

- **react-pdf-highlighter viability:** The annotation overlay depends on this community-maintained library. Before Phase 1 annotation sprint, verify: last commit date, open issue count, React 19 compatibility, coordinate system alignment with PDF.js 4.x. If unmaintained, the fallback is a raw PDF.js canvas with a custom SVG overlay — more work but no third-party risk.
- **Pix Automatico implementation complexity:** Stripe's recurring PIX consent (Pix Automatico) is a 2025 feature. Before Phase 2 billing sprint, verify the exact Stripe API flow for mandate creation and confirm Railway (São Paulo region) supports it. If too complex, fall back to annual plans paid via PIX one-time with manual renewal reminders.
- **WatermelonDB sync endpoint design:** The sync protocol (what constitutes a pull payload, how sequence numbers work, how conflicts are surfaced) must be designed on paper before writing any mobile sync code. Research the existing WatermelonDB sync examples carefully — the protocol is flexible but underspecified in docs.
- **NBR checklist content design:** The AI compliance feature requires a structured checklist of NBR requirements (written as natural-language questions, not ABNT text) before any prompt engineering work. This is domain knowledge work, not engineering — needs input from the engenheiro beta testers.
- **@hyzyla/pdfium production readiness:** This is the server-side PDF conversion library. Verify npm download trends, GitHub stars, and last release date. If it shows signs of abandonment, the alternative is using Poppler (GPL, check distribution terms) or pdfcpu (MIT) for manipulation tasks.

---

## Sources

### Primary (HIGH confidence)
- nextjs.org/blog — Next.js 15, Turbopack stable, React 19 support confirmed
- expo.dev/changelog/sdk-53 — Expo SDK 53 changelog, WatermelonDB Config plugin
- docs.expo.dev/guides/local-first/ — Expo offline-first architecture patterns
- bullmq.io — BullMQ official documentation, queue patterns
- aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/ — RLS multi-tenancy authoritative guide
- www.thenile.dev/blog/multi-tenant-rls — RLS implementation patterns
- docs.stripe.com/payments/pix — Stripe Pix documentation
- developers.cloudflare.com/r2/ — Cloudflare R2 zero-egress model
- trpc.io/docs/client/nextjs — tRPC v11 Next.js integration
- github.com/wojtekmaj/react-pdf — react-pdf (PDF.js React wrapper)
- fastify.dev benchmarks — Fastify vs Express performance claims

### Secondary (MEDIUM confidence)
- betterstack.com — Fastify vs Express vs Hono comparison
- bytebase.com/blog/drizzle-vs-prisma/ — ORM comparison
- supabase.com — WatermelonDB offline-first React Native guide
- blog.react-pdf.dev — PDF.js layer architecture for annotations
- medium.com — Next.js 15 vs 14 migration guide (community)
- focoenobra.com, plataformadeobras.com.br, blog.obraprima.eng.br — Brazilian construction SaaS competitive landscape
- pivotly.com, buildern.com, selecthub.com — Global construction software comparison
- complydog.com — Brazil LGPD compliance for SaaS
- stripe.com/resources/more/pix-replacing-cards-cash-brazil — Pix adoption data
- sachith.co.uk — Offline sync conflict resolution patterns (Feb 2026)
- medium.com/@instatunnel — PostgreSQL RLS failure modes (Jan 2026)

### Tertiary (LOW confidence — validate during planning)
- kartado.com.br, rdoweb.com.br — Brazilian RDO SaaS features (market claims only)
- altersquare.medium.com — Construction software UX patterns (industry blog)
- medium.com/@vladyslav.stetsenko — Solo SaaS lessons (anecdotal; directionally useful for scope discipline advice)

---

*Research completed: 2026-03-13*
*Ready for roadmap: yes*
