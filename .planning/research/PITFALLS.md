# Pitfalls Research

**Domain:** Construction Management SaaS — Visual collaboration on PDF blueprints, Brazilian market, solo dev
**Researched:** 2026-03-13
**Confidence:** MEDIUM-HIGH (domain-specific claims verified with multiple sources; Brazilian market nuances from MEDIUM sources)

---

## Critical Pitfalls

### Pitfall 1: Pin Coordinates Become Orphaned After PDF Version Upgrade

**What goes wrong:**
Anchored comments ("pins") are stored with X/Y coordinates relative to a specific rendered page at a specific zoom/DPI. When the client uploads a new revision (R0 → R1), even a minor change (title block update, margin shift) can move structural elements by millimeters. Pins stored against the old coordinate system now point to blank space or the wrong wall. The anchor is silently wrong — no error, just misdirected feedback.

**Why it happens:**
PDF coordinate systems have a bottom-left origin in PDF user-space units, but PDF.js renders in canvas pixel space — the mapping depends on DPI, zoom, and page rotation. Developers store canvas pixel coordinates directly instead of normalized PDF user-space coordinates. There is no versioning contract between the pin data model and the PDF revision it references.

**How to avoid:**
- Store pin positions as normalized PDF user-space coordinates (0.0–1.0 fractions of page width/height), not canvas pixels
- Attach every pin to a specific `pdf_revision_id` — never a mutable "current" pointer
- When a new revision is uploaded, mark all pins from the previous revision as "revision: R0" and display them as historical overlays on the new document
- Never attempt automatic coordinate migration across revisions — show the pin at its original position with a "position may have shifted" warning badge

**Warning signs:**
- Pin coordinates stored as integers (pixels) in the database rather than floats between 0.0 and 1.0
- No `revision_id` foreign key on the annotations table
- "Where did my comment go?" reports from beta testers after any PDF upload

**Phase to address:** Phase 1 (PDF Viewer) — the data model must be correct from the first pin stored. Retrofitting this after launch requires a full migration.

---

### Pitfall 2: PDF.js Memory Exhaustion on Large Engineering Drawings

**What goes wrong:**
Architectural blueprints for medium-sized Brazilian construction projects routinely exceed 50MB and contain dozens of A0-format pages at 300+ DPI. PDF.js renders each visible page to an HTML canvas element. Without cleanup, all rendered canvases stay in memory simultaneously. On a mid-range Android device (common on Brazilian job sites), this causes the tab to crash after scrolling through 4–6 pages. Field workers cannot view the document they need.

**Why it happens:**
Developers test with small PDFs on desktop Chrome. PDF.js does not garbage-collect canvases automatically. Rendering multiple pages eagerly (for smooth scrolling) compounds the problem. The issue is invisible in development and only manifests on low-RAM mobile devices with large files.

**How to avoid:**
- Enable lazy rendering: only render the page currently in the viewport + 1 page ahead
- Destroy canvas elements for pages more than 2 pages from the viewport (`page.cleanup()` in PDF.js API)
- Enable HTTP byte-range streaming: serve PDFs from R2/S3 with `Accept-Ranges: bytes` support — PDF.js will only download the pages being viewed
- Set a hard upload limit of 100MB per PDF revision with server-side validation
- Run server-side conversion (Ghostscript or PDFium) to optimize embedded assets before storing: remove duplicate streams, compress images, subset fonts
- Test specifically with 50MB+ PDFs on a mid-range Android device before any demo

**Warning signs:**
- No `page.cleanup()` calls in the PDF viewer component
- PDF files served without byte-range support (check `Accept-Ranges` header)
- Test PDFs are all under 5MB
- The PDF viewer component renders all pages into the DOM simultaneously

**Phase to address:** Phase 1 (PDF Viewer) — must be addressed during initial viewer implementation, not after.

---

### Pitfall 3: Multi-Tenant Data Leakage via Missing RLS Policies

**What goes wrong:**
A query returns records from a different construtora's obra. This is a catastrophic trust violation in a B2B SaaS. In the Brazilian construction market — where companies are conservative and skeptical of new software — a single data leak incident ends the product's reputation permanently.

**Why it happens:**
PostgreSQL Row Level Security (RLS) must be explicitly enabled on every table and enforced with both `USING` (read) and `WITH CHECK` (write) clauses. Teams add RLS to tables they remember but forget newly-created tables. Connection poolers (PgBouncer in transaction mode) reset session variables inconsistently — if `app.current_tenant_id` is set via `SET LOCAL`, it evaporates when the connection returns to the pool. Recent CVEs (CVE-2024-10976) have shown PostgreSQL's optimizer can leak RLS-protected row statistics in certain subquery patterns.

**How to avoid:**
- Enable RLS on every table at creation time — add a database migration linter rule that rejects any new `obras_*` or tenant-scoped table created without an RLS policy
- Use `USING (tenant_id = current_setting('app.tenant_id')::uuid)` AND `WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)` on every policy
- Use PgBouncer in Session Pooling mode (not Transaction mode) with `server_reset_query = DISCARD ALL`
- Never grant SUPERUSER or BYPASSRLS to the application database role
- Write integration tests that create two tenants, insert data as tenant A, then query as tenant B — assert zero rows returned
- Add a secondary application-layer filter (`WHERE tenant_id = $tenantId`) as defense in depth — do not rely on RLS alone

**Warning signs:**
- Application database role has SUPERUSER privileges
- PgBouncer configured in transaction pooling mode
- No integration test that verifies cross-tenant isolation
- New tables added without checking existing RLS policy coverage

**Phase to address:** Phase 1 (Foundation/Auth) — tenant isolation must be built into the schema from day one. Retrofitting RLS onto an existing production database with live data is high-risk.

---

### Pitfall 4: LLM Cost Runaway on NBR Compliance Checks

**What goes wrong:**
The NBR compliance check feature (Claude API) is invoked per-element on a complex obra. A single obra review could trigger 50–200 API calls. If caching is absent and per-plan billing is not enforced, a "viral moment" or a scripted abuse pattern generates a $5,000–$50,000 API bill in hours. The project cannot absorb this on a solo-dev budget.

**Why it happens:**
Developers underestimate token volume: a detailed NBR checklist prompt with context easily reaches 4,000–8,000 input tokens, and output responses add 1,000–3,000 tokens. At scale, output tokens cost 3–10x more than input tokens. Without hard per-tenant usage quotas enforced server-side, a single bad actor or infinite retry bug can exhaust the monthly budget.

**How to avoid:**
- Implement prompt caching: NBR checklists are static — the system prompt and checklist content qualify for Anthropic's prompt caching (up to 90% cost reduction on cached input tokens)
- Enforce per-plan monthly AI call limits at the API gateway layer, not just client-side: Free=10 checks/month, Pro=100/month, Business=500/month
- Store check results in the database with a TTL — do not re-check an element that was checked within 30 days unless the PDF revision changed
- Set Anthropic API spending alerts at 50% and 80% of monthly budget; implement automatic circuit-breaker at 100%
- Use Claude Haiku for simple checklist validation (low cost); reserve Sonnet/Opus for complex analysis only
- Test the cost of a full obra review before launch: run a representative obra through the full NBR check and calculate the actual token spend

**Warning signs:**
- No per-tenant usage counter in the database
- No spending alert configured in the Anthropic console
- NBR check results not cached in the database
- Using Claude Opus/Sonnet for all calls regardless of complexity

**Phase to address:** Phase 3 (AI/Scale) — but the database schema for usage tracking should be established in Phase 1 so the counters are available when billing is wired up in Phase 2.

---

### Pitfall 5: Offline Sync Conflicts Silently Overwrite Field Data

**What goes wrong:**
A field engineer updates the diário de obra (daily log) on the mobile app while offline at the canteiro. Simultaneously, the office engineer adds a note to the same log entry via the web app. When the field engineer reconnects, a naive Last-Write-Wins (LWW) sync silently discards the office note. The office engineer sees their note disappear with no explanation. Trust in the system collapses.

**Why it happens:**
LWW is the easiest conflict resolution strategy to implement and seems safe because "the latest change wins." But with distributed edits (mobile offline + web online), timestamps cannot be trusted: mobile device clocks are unreliable, and "latest" is ambiguous. LWW is unsuitable for append-style records like diary entries.

**How to avoid:**
- Design the diário de obra as an append-only log, not a mutable document: each entry is immutable once created; edits create new versions
- Use server-assigned sequence numbers (not client timestamps) as the authoritative ordering
- For structured fields (task status, checkboxes), implement field-level merging: treat each field as an independent CRDT where last-server-write wins per field, not per record
- Implement a "sync conflict" UI state: when conflicts are detected, surface them to the user rather than silently resolving — "This entry was also modified by [user]. Keep yours / Keep theirs / Merge?"
- Log every sync operation server-side with before/after state for debugging
- Test conflict scenarios explicitly before release: write automated tests that simulate concurrent offline + online edits

**Warning signs:**
- Sync logic uses `INSERT ... ON CONFLICT DO UPDATE` without field-level granularity
- No conflict detection logic in the sync endpoint
- Mobile timestamps used as the source of truth for ordering
- No UI component designed for displaying sync conflicts

**Phase to address:** Phase 2 (Mobile/Offline) — the sync protocol and conflict strategy must be designed before the first offline-capable release. Changing conflict resolution after users have data is extremely difficult.

---

### Pitfall 6: Ghostscript AGPL License Violation in Production

**What goes wrong:**
The server-side PDF optimization pipeline uses Ghostscript to compress and optimize uploaded blueprints. The product ships, generates revenue, and 12 months later Artifex (Ghostscript's commercial licensor) contacts the company demanding commercial license fees or source code disclosure. Ghostscript under AGPL requires that any network service using it must make the complete application source code available.

**Why it happens:**
Ghostscript is the obvious, free, and well-documented tool for server-side PDF processing. Its dual-license (AGPL + commercial) is documented but easy to overlook during prototyping. The AGPL's "network use" clause is broader than GPL — you don't need to distribute the software for the obligation to trigger; serving users over a network is sufficient.

**How to avoid:**
- Use PDFium (BSD license, no commercial restrictions) for PDF rendering and validation
- Use `pdf2image` with Poppler (GPL — check distribution terms) or `pdfcpu` (MIT license) for PDF manipulation
- If Ghostscript must be used for a specific capability, budget for Artifex commercial license from the start ($X/year), or architect the system so Ghostscript runs in an isolated, open-source service
- Document the license of every PDF-related library in a `THIRD_PARTY_LICENSES.md` during Phase 1

**Warning signs:**
- Ghostscript in `Dockerfile` or server dependencies without a commercial license or license review
- No `THIRD_PARTY_LICENSES.md` or equivalent license audit document
- PDF processing libraries chosen based on tutorials without checking license terms

**Phase to address:** Phase 1 (PDF Pipeline) — license choice is a foundation decision. Changing the PDF processing library after the pipeline is built is disruptive.

---

### Pitfall 7: Stripe + PIX Subscription Model Mismatch

**What goes wrong:**
The billing model charges per active obra (not per user). Stripe Subscriptions are designed for seat-based or flat-rate billing. Implementing "obra count" billing requires metered billing or quantity updates on subscription items. If this is not designed correctly, a construtora can add 10 obras on a Free plan without triggering an upgrade prompt, or upgrade and downgrade within the same billing cycle without correct proration. Revenue is lost and edge cases cause support burden.

Additionally, PIX is the dominant payment method for Brazilian SaaS customers (40%+ of online transactions). Stripe added PIX support in 2024–2025, but PIX does not support recurring payments natively — `Pix Automático` (recurring consent-based PIX) only rolled out in 2025 and requires specific Stripe configuration. Without this, monthly subscribers must manually approve each PIX payment.

**How to avoid:**
- Use Stripe Metered Billing with `usage_type: metered` for obra count, reporting usage at billing cycle end
- Alternatively, use Stripe's `quantity` field on subscription items and update it via webhook when obras are created/archived
- Implement `Pix Automático` from the start rather than one-time PIX — requires registering a mandate with the customer at subscription creation
- Handle IOF tax (3.5% on BRL→USD foreign exchange) explicitly in pricing display: show the gross amount inclusive of IOF, not net
- Test the full obra lifecycle billing: create obra → verify subscription quantity update → archive obra → verify quantity decrease → billing cycle close → verify correct charge
- Add a webhook handler for `customer.subscription.updated` to sync obra quotas with subscription state

**Warning signs:**
- Billing implementation uses Stripe fixed-price subscriptions with no obra count tracking
- PIX integrated as one-time payment only (no recurring consent)
- No IOF disclosure in pricing page or invoice
- No webhook handler for subscription changes that updates the application's quota enforcement

**Phase to address:** Phase 2 (Billing) — but the obra count data model must support the billing query from Phase 1.

---

### Pitfall 8: Onboarding Friction Kills Adoption with Conservative Engineers

**What goes wrong:**
Brazilian civil engineers are described in the project context as "conservadores com resistência a novo software." They are used to WhatsApp and PDFs. If the first session requires more than 5 minutes to reach a meaningful "aha moment" (seeing a pin on their own blueprint), they close the tab and return to WhatsApp. The product never gets a second chance.

**Why it happens:**
Developers build onboarding flows that make sense to the developer (who understands all the concepts) but not to a 45-year-old engenheiro civil who has never used collaborative design software. Generic "welcome wizard" flows that ask for company name, team size, and use-case before showing any value are the most common offender. The user completes setup but has nothing useful to look at.

**How to avoid:**
- The first session must reach "pin on blueprint" within 3 minutes from account creation, with zero configuration
- Provide a pre-loaded sample obra (obra demo with a real-looking blueprint and 2–3 example pins) so the user sees the product working before they upload anything
- The upload flow must accept a PDF and place the user in the viewer immediately — do not require project name, team members, or any metadata before showing the viewer
- Validate onboarding time with the 2 beta tester engenheiros before Phase 1 launch
- Mobile onboarding must work with poor connectivity: if PDF upload fails on mobile, show a clear retry — never a generic error

**Warning signs:**
- Onboarding flow has more than 3 steps before the user sees a blueprint
- No sample/demo obra available on first login
- Onboarding time not measured in analytics
- The first screen after signup is a dashboard with empty state and no guided action

**Phase to address:** Phase 1 (MVP/Onboarding) — onboarding quality determines whether beta testers convert to paying users.

---

### Pitfall 9: LGPD Non-Compliance Exposed During a Sales Cycle

**What goes wrong:**
A mid-sized construtora's legal or IT team asks for a data processing agreement (DPA) and proof of LGPD compliance before signing. The product has no DPA template, no documented data retention policy, no Privacy Policy in Portuguese, and no process for data subject access requests. The deal dies. Larger clients require this before signing contracts with any SaaS provider.

**Why it happens:**
LGPD compliance is invisible during development and easy to defer. Solo developers focus on product features, not legal documentation. The Brazilian ANPD (data protection authority) ramped up audits post-2024, and enterprise clients increasingly require evidence of compliance as a procurement requirement.

**How to avoid:**
- Draft a Privacy Policy and Terms of Service in Portuguese before the first paid customer
- Implement a data deletion endpoint: when a construtora cancels, all their data (obras, PDFs, users, annotations) must be deletable within 30 days on request
- Store consent records: when users accept terms, log timestamp, version accepted, and IP
- Designate a DPO (can be the solo founder initially) — document this
- Implement data export: users must be able to export their obra data (LGPD right to portability)
- Do not store any data in the US/EU without documenting the cross-border transfer basis

**Warning signs:**
- No Privacy Policy page in the application
- No data deletion capability in the admin panel
- Consent not recorded in the database
- All infrastructure in non-Brazilian regions without a cross-border transfer justification

**Phase to address:** Phase 1 (Foundation) — legal groundwork before the first paying customer, not after. A data breach or ANPD audit without documentation has severe consequences.

---

### Pitfall 10: Solo Dev Scope Creep Leading to Abandoned MVP

**What goes wrong:**
The feature list in PROJECT.md contains 27+ active requirements. A solo developer attempts to build all of them in parallel. After 6 months, everything is 60% done and nothing is shippable. The beta testers (the 2 engenheiro friends) have been waiting so long they started using a competitor. The project never ships.

**Why it happens:**
Full-stack + mobile + AI + real-time + billing is genuinely too large for a single developer to build without strict sequential phasing. The temptation to "also add this" during development is constant. Without a forcing function (a deadline, a beta commitment, a public announcement), scope expands to fill all available time.

**How to avoid:**
- Define a hard Phase 1 cutoff: a specific date by which the MVP ships with NO features added after the cutoff is set
- Phase 1 must include only: auth, obra CRUD, PDF upload/viewer, pins on PDF, and basic diário — nothing else
- Treat any feature not in Phase 1 as if it doesn't exist yet — maintain a "parking lot" list and review it only at phase boundaries
- Commit beta testers to a specific date: "You will have access on [date]" creates accountability
- Measure progress by working demos, not lines of code or percent complete estimates

**Warning signs:**
- Phase 1 still includes Gantt, real-time collaboration, AI checks, mobile offline, and billing simultaneously
- "I'll just add this small feature" appears in weekly progress notes
- No specific ship date for Phase 1 committed to beta testers
- Development has been ongoing for 3+ months with no deployed demo

**Phase to address:** Phase 0 (Planning) — scope discipline is a planning decision, not a development decision. The roadmap must enforce this.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store canvas pixel coords for pins | Simpler initial implementation | Full annotation migration required after any PDF viewer zoom/DPI change | Never — use normalized coords from day 1 |
| Skip RLS on "internal" tables | Faster schema iteration | Silent cross-tenant data leakage | Never |
| LWW for all sync conflicts | Simple sync implementation | Silent data loss on concurrent edits | Only for metadata fields (last_seen_at), never for user content |
| Single-tenant database queries with no tenant filter | Simpler queries during dev | Query works in dev but leaks data in production | Never in shared-schema multitenant system |
| Hardcode Claude Sonnet for all AI calls | Simpler prompt development | 5–10x cost vs. Haiku for simple checks | Only during development/testing, never in production |
| No obra count quota enforcement | Faster billing setup | Free users can use Pro features indefinitely | Never — implement quota enforcement in Phase 2 |
| Ghostscript for PDF optimization | Easy to set up, powerful | AGPL license violation in SaaS context | Only if commercial license is purchased |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe + PIX | Using one-time PIX payment for subscriptions | Implement `Pix Automático` (recurring consent mandate) for subscriptions |
| Stripe metered billing | Updating usage at the end of billing cycle only | Report usage incrementally; report on obra creation and archival events |
| Claude API / Anthropic | Not enabling prompt caching on static system prompts | Mark the NBR checklist system prompt as cacheable with `cache_control: {"type": "ephemeral"}` |
| PDF.js + R2/S3 | Serving PDFs without byte-range support | Set `Accept-Ranges: bytes` and `Content-Length` headers; verify with `curl -I` |
| WebSocket + reverse proxy | Nginx/Caddy not configured for WebSocket upgrade | Explicitly configure `proxy_http_version 1.1` and `Upgrade` headers in proxy config |
| PgBouncer + RLS | Transaction pooling mode drops `SET LOCAL` session variables | Use session pooling mode or pass tenant_id on every query, not via session variable |
| React Native offline sync | Using device clock for conflict resolution | Use server-assigned sequence numbers; never trust client timestamps |
| LGPD + data export | No export endpoint implemented | Build a background job that generates a ZIP of all obra data in portable format |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all PDF pages to canvas simultaneously | Browser tab crashes on large PDFs, mobile OOM | Destroy canvases for pages >2 viewport-lengths away; stream via byte-range | Any PDF >10 pages on mobile with <4GB RAM |
| Loading all annotations for an obra on viewer init | Viewer takes 5–10s to load on complex obras | Paginate annotations by viewport bounds; lazy load off-screen pins | ~500+ pins per obra |
| N+1 query on obras list (fetching member count, last activity per obra) | Obras list page slows as user adds more obras | Use single JOIN query or precompute counts in a `obras_stats` materialized view | ~50+ obras per tenant |
| WebSocket broadcast to all connected users on every annotation | WebSocket server becomes bottleneck | Broadcast only to users in the same obra room; use presence filtering | ~100+ concurrent users across all obras |
| Synchronous NBR AI check on HTTP request | Request times out (>30s) on complex obras | Run AI checks as background jobs; poll for completion; return 202 Accepted immediately | Any check with >10 elements |
| Photo upload blocking the mobile UI thread | App freezes while uploading diário photos | Upload photos in a background service; show optimistic local preview immediately | Any photo >2MB on slow mobile network |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| PDF file path traversal | Attacker downloads other tenants' blueprints via path manipulation | Store files with UUID filenames in R2/S3, never user-provided names; serve via signed URLs with expiry |
| Signed URL over-sharing | Client portal link gives access to all tenant PDFs | Generate per-file signed URLs with 1-hour expiry; never expose bucket URLs directly |
| Missing `WITH CHECK` on RLS policies | Attacker inserts rows with another tenant's `tenant_id` | Every RLS policy requires both `USING` and `WITH CHECK` clauses |
| WebSocket auth not validated on upgrade | Unauthenticated users join obra rooms by guessing IDs | Validate JWT on WebSocket upgrade handshake before allowing room join; do not rely on HTTP session |
| ABNT NBR text reproduction in AI responses | Copyright violation (ABNT holds NBR copyright) | Instruct Claude via system prompt to never quote NBR text verbatim; return only pass/fail/attention judgments with article numbers |
| Mass file upload abuse | Storage and bandwidth costs blown by malicious actors | Enforce per-tenant storage quotas; scan upload MIME type server-side (not just extension); rate-limit upload endpoint |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Empty dashboard on first login | Engineers see a blank screen and don't know what to do | Pre-load a demo obra with a real blueprint and example pins; make it the default view |
| PDF viewer opens at page 1 (full document) on mobile | Engineers on canteiro can't find their relevant section | Remember last-viewed page per user per obra; open to that page on return |
| Generic Portuguese error messages ("Algo deu errado") | Engineers don't know if they should retry or contact support | Categorize errors: connection errors → auto-retry; validation errors → specific field message; server errors → "Tente novamente em 5 min" |
| Annotation pin covers the element being discussed | Engineers can't read the blueprint under the pin | Make pins semi-transparent by default; allow repositioning; collapse to dot when not hovered |
| Requiring company name/CNPJ before showing the product | Drop-off before the user experiences any value | Defer all company metadata to after the first obra is created |
| Sync conflict resolved silently on mobile | Engineers find their notes missing with no explanation | Always surface conflicts to the user; never silently discard content |

---

## "Looks Done But Isn't" Checklist

- [ ] **PDF Viewer:** Appears to work in desktop Chrome — verify on mid-range Android (Moto G-class) with a 50MB PDF
- [ ] **Annotation pins:** Appear correct on upload — verify pin positions survive a page zoom change (from 100% to 150% to 75%)
- [ ] **PDF versioning:** Pins appear on correct positions — verify pins from R0 are correctly attributed to R0 when R1 is uploaded, not silently migrated
- [ ] **Multi-tenancy:** Queries return correct data in dev — verify with a two-tenant integration test that query as tenant B returns zero rows from tenant A
- [ ] **Offline sync:** Mobile app shows cached data — verify conflict scenario: edit same diary entry offline on mobile and online on web, then sync; check result
- [ ] **Billing:** Stripe checkout completes — verify obra quota enforcement: free user cannot create obra N+1 beyond plan limit
- [ ] **AI NBR check:** Returns results — verify that the same check request in the same revision returns cached results, not a new API call
- [ ] **WebSocket auth:** Real-time updates arrive — verify that a WebSocket connection without a valid JWT is rejected at the upgrade handshake
- [ ] **LGPD:** Privacy Policy exists — verify the deletion flow: delete a test tenant and confirm all their data is gone from all tables and R2 storage
- [ ] **Onboarding:** Wizard completes — time it with a real engenheiro who has never seen the product: must reach first pin in under 5 minutes

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pin coordinates stored as pixels (wrong schema) | HIGH | Write a migration to recalculate normalized coordinates from known DPI at time of storage; flag pins with uncertainty; notify users to verify positions |
| Multi-tenant data leaked | CRITICAL | Immediate incident response: identify affected tenants, notify within 72 hours per LGPD Art. 48, audit all queries for the leak vector, patch, re-audit |
| LLM cost runaway | HIGH | Emergency circuit-breaker: set spending limit to $0 in Anthropic console immediately; implement quotas; negotiate credit with Anthropic support |
| RLS missing on a table | HIGH | Add RLS policy in emergency migration; audit existing data for cross-tenant contamination; patch; write regression test |
| Ghostscript AGPL violation discovered | MEDIUM-HIGH | Switch to PDFium/pdfcpu in a scheduled sprint; if distribution has already occurred, consult IP lawyer; purchase commercial license as bridge |
| PIX subscriptions not recurring | MEDIUM | Add Pix Automático mandate flow; notify existing PIX subscribers to re-authorize; send email explaining the change |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pin coordinate system (orphaned anchors) | Phase 1 — PDF Viewer | Integration test: upload PDF, place pin, change zoom, verify coordinates unchanged |
| PDF.js memory exhaustion | Phase 1 — PDF Viewer | Load test: open 50MB PDF on Moto G-equivalent device, scroll all pages, check memory profile |
| Multi-tenant data leakage | Phase 1 — Foundation/Auth | Automated test: two-tenant isolation test in CI pipeline |
| LLM cost runaway | Phase 2 — Billing schema; Phase 3 — AI features | Monthly cost stays within budget after 30 days of Phase 3 in production |
| Offline sync conflict overwrites | Phase 2 — Mobile/Offline | Conflict simulation test: automated concurrent edit + sync scenario |
| Ghostscript license violation | Phase 1 — PDF Pipeline | License audit document created and reviewed before any PDF library committed |
| Stripe + PIX mismatch | Phase 2 — Billing | Full obra lifecycle billing test: create → upgrade → archive → billing cycle |
| Onboarding friction | Phase 1 — MVP | Timed usability test with 2 beta engenheiros: target <5 min to first pin |
| LGPD non-compliance | Phase 1 — Foundation | Privacy Policy in Portuguese published; data deletion endpoint exists; consent logged |
| Solo dev scope creep | Phase 0 — Planning | Phase 1 feature list locked; ship date committed to beta testers; no additions after cutoff |

---

## Sources

- [PDF.js memory issues — react-pdf GitHub Discussion #1691](https://github.com/wojtekmaj/react-pdf/discussions/1691)
- [How to Fix Memory Leaks in JavaScript PDF Viewers — Syncfusion Blog](https://www.syncfusion.com/blogs/post/memory-leaks-in-javascript-pdf-viewer)
- [Optimizing In-Browser PDF Rendering — Joyfill](https://joyfill.io/blog/optimizing-in-browser-pdf-rendering-viewing)
- [Multi-Tenant Leakage: When Row-Level Security Fails in SaaS — Medium/InstaTunnel (Jan 2026)](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)
- [Postgres RLS Implementation Guide — permit.io](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [Multi-tenant data isolation with PostgreSQL RLS — AWS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [LLM Cost Control: Practical LLMOps Strategies — Radicalbit](https://radicalbit.ai/resources/blog/cost-control/)
- [Anthropic Claude API Pricing 2026 — MetaCTO](https://www.metacto.com/blogs/anthropic-api-pricing-a-full-breakdown-of-costs-and-integration)
- [Offline sync conflict resolution patterns — Sachith Dassanayake (Feb 2026)](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/)
- [Offline-First Architecture in Flutter — DEV Community](https://dev.to/anurag_dev/implementing-offline-first-architecture-in-flutter-part-1-local-storage-with-conflict-resolution-4mdl)
- [Pix payments — Stripe Documentation](https://docs.stripe.com/payments/pix)
- [A guide to Pix payments in Brazil — Stripe](https://stripe.com/resources/more/pix-replacing-cards-cash-brazil)
- [Brazil LGPD Complete Data Protection Compliance Guide — ComplyDog](https://complydog.com/blog/brazil-lgpd-complete-data-protection-compliance-guide-saas)
- [Ghostscript AGPL licensing — Ghostscript.com](https://ghostscript.com/)
- [PDF rendering engine performance comparison — Hyland Connect](https://connect.hyland.com/t5/alfresco-blog/pdf-rendering-engine-performance-and-fidelity-comparison/ba-p/125428)
- [Why Construction Software Feels Stuck in the 90s — AlterSquare/Medium](https://altersquare.medium.com/why-construction-software-feels-stuck-in-the-90s-ui-ux-challenges-in-industrial-applications-52842619b776)
- [Field-First UX: Designing Offline-Capable BIM Tools — AlterSquare/Medium (Jun 2025)](https://altersquare.medium.com/field-first-ux-designing-offline-capable-bim-tools-for-job-site-realities-e201627e50f2)
- [What 4 Months of Solo SaaS Building Taught Me — Medium (May 2025)](https://medium.com/@vladyslav.stetsenko.primary/what-4-months-of-solo-saas-building-taught-me-the-hard-way-bb2270916134)
- [PDF Coordinate Systems for Better Processing — Apryse](https://apryse.com/blog/pdf-coordinates-and-pdf-processing)
- [plangrid/pdf-annotate — GitHub (PlanGrid, construction industry PDF annotations)](https://github.com/plangrid/pdf-annotate)

---
*Pitfalls research for: Construction Management SaaS (ProjetaPro) — Brazilian market, solo dev*
*Researched: 2026-03-13*
