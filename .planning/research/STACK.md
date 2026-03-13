# Stack Research

**Domain:** Construction Management SaaS — Brazil market, PDF collaboration, real-time, mobile offline
**Researched:** 2026-03-13
**Confidence:** HIGH (core stack), MEDIUM (PDF strategy, mobile offline)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (App Router) | Web frontend + API routes | React 19 + Turbopack stable + Server Components reduce client JS bundle; App Router is the production pattern as of 2025. Next.js 14 is end of active development — start on 15. |
| Fastify | 5.x | Standalone API server (WebSocket + background logic) | 2-3x faster than Express for JSON, mature plugin ecosystem, built-in schema validation with Zod. Choose over Hono because Fastify's Node.js-native ecosystem is deeper and you already have Prisma which targets Node. Hono wins on edge/serverless — irrelevant here. |
| PostgreSQL | 16.x | Primary database | Best-in-class for relational + JSONB (useful for anchored comment coordinates, metadata). Supports `SKIP LOCKED` for job queues. Railway and Render both provide managed PG 16. |
| Redis | 7.x | Session store + BullMQ broker + rate limiting | Required for BullMQ job queues and real-time pub/sub fan-out across Fastify instances. Without Redis, Socket.io cannot scale beyond one server process. |
| Prisma | 5.x | ORM | Schema-first, excellent TypeScript type generation, Prisma Studio for solo dev productivity, migration tooling is more mature than Drizzle for a team of one. Prisma 5 removed the Rust engine overhead that existed in v4. **Note:** Prisma 6 / 7 shipping in late 2025 removes Rust entirely — if you start in mid-2026, verify current major version. |
| Socket.io | 4.x | Real-time WebSocket layer | Self-hosted (no SaaS cost), works with the Fastify adapter, supports Redis adapter for horizontal scaling. Liveblocks is excellent but adds $99+/month cost that is unnecessary for a solo dev at MVP stage. |
| React Native + Expo | SDK 53 | Mobile app (iOS + Android) | Managed workflow with EAS Build. SDK 53 targets React Native 0.79. WatermelonDB plugin is now in official Expo Config plugin list — offline-first is solved. Do NOT use bare workflow without a native dev on the team. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-pdf (`@react-pdf-viewer/core`) | latest | PDF rendering in browser | Phase 1 viewer. Canvas-based, PDF.js underneath, handles large files reasonably. Use for basic viewing + zoom/navigation. |
| react-pdf-highlighter | ^6.x | Anchored annotations overlay | Builds on react-pdf, provides highlight/pin annotation primitives. Use to implement the "pins on blueprint" feature. Store annotation coordinates as `{page, x, y, width, height}` in PostgreSQL. |
| @hyzyla/pdfium + sharp | latest | Server-side PDF-to-image conversion | For large PDFs (>10MB), pre-render pages as JPEG tiles server-side and serve images to the viewer. Avoids 50MB+ PDF transfers to mobile. Run as a BullMQ job on upload. |
| WatermelonDB | ^0.28.x | Mobile offline database + sync | SQLite-backed, reactive, tested at 500K+ users. Best choice for obra diary (diário de obra) with photos that need to queue for upload when offline. The Expo Config plugin handles native setup without ejecting. |
| tRPC | v11.x | Internal API type safety | Use for web client ↔ Next.js App Router calls. Gives full TypeScript end-to-end inference without REST boilerplate. Do NOT expose tRPC to the public API — use REST there instead. |
| TanStack Query | v5.x | Server state management | Pairs with tRPC for caching, background refetch, optimistic updates on the web. Required for making the app feel fast on spotty Brazilian mobile connections. |
| Zustand | v5.x | Client state (UI, modal state, canvas state) | Minimal boilerplate, no Provider wrapping. Use for viewer state (current page, zoom, selected pin) that does not need to be persisted to server. |
| BullMQ | v5.x | Background job queue | PDF processing, email sends, report generation, AI checklist calls. Backed by Redis. Do NOT run these synchronously in request handlers — PDF processing can take 10+ seconds. |
| pg-boss | — | **NOT recommended** | Would let you skip Redis, but BullMQ's UI (Bull Board) and ecosystem are much more mature. Since Redis is already required for Socket.io scaling, adding BullMQ costs nothing extra. |
| Zod | v3.x | Schema validation | Shared across backend (Fastify route schemas) and frontend (form validation). Single source of truth for types when combined with tRPC. |
| React Hook Form | v7.x | Form management | Uncontrolled inputs, minimal re-renders, native Zod resolver. Use for all forms: obra creation, member invite, task scheduling. |
| next-auth / Auth.js | v5.x (Auth.js) | Authentication | Email/password + Google OAuth built-in. JWTs stored in httpOnly cookies. Connects to Prisma adapter. Auth.js v5 is the stable release for Next.js 15 App Router. |
| Stripe | latest SDK | Billing | Supports Pix (Brazilian instant payment) natively since 2025, including Pix Automático for subscriptions. Use Stripe Billing for Free/Pro/Business plans. Webhook handler goes in Fastify (not Next.js route) to keep billing logic out of the frontend layer. |
| Resend + React Email | latest | Transactional email | Clean React-based email templates, first-class Next.js integration, generous free tier. Use for: invite emails, notification digests, payment receipts. Switch to SendGrid only if you exceed 100K emails/month. |
| Cloudflare R2 | — | Object storage (PDFs, photos) | Zero egress fees vs S3's $0.09/GB. For a construction app with many large PDFs and field photos, egress adds up fast. S3-compatible API means no vendor lock-in. Start with R2, not S3. |
| sharp | v0.33.x | Image processing | Used alongside pdfium for server-side PDF tile generation and photo thumbnail creation (diary photos). |
| Anthropic SDK (`@anthropic-ai/sdk`) | latest | AI NBR checklist | Claude API calls for assisted NBR compliance checks. Wrap in BullMQ jobs, not request handlers, to avoid timeout. Rate-limit per plan tier at the application layer. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm workspaces | Monorepo package management | Shared types between `apps/web`, `apps/mobile`, `packages/db`, `packages/types`. Faster than npm/yarn for monorepos. |
| Turborepo | Monorepo build orchestration | Caches builds across packages. Keeps `pnpm dev` fast even as the codebase grows. |
| TypeScript | 5.x | End-to-end type safety | Strict mode. The entire value of tRPC + Prisma collapses without strict TS. |
| ESLint + Prettier | Linting and formatting | Use `eslint-config-next` for web, `eslint-plugin-react-native` for mobile. Prettier as formatter (not ESLint stylistic rules). |
| Vitest | Unit + integration testing | Faster than Jest, native ESM support, compatible with the Fastify test helper. Use for: Zod schemas, utility functions, Prisma query helpers. |
| Playwright | E2E testing | Test the PDF viewer, annotation flow, and onboarding. Not required at MVP — add in Phase 2 when the core workflow stabilizes. |
| Docker Compose | Local dev environment | Run PostgreSQL + Redis locally without cloud dependency. Single `docker-compose.yml` with pg + redis services. |
| Bull Board (`@bull-board/fastify`) | BullMQ job queue UI | Mount on `/admin/queues` behind auth. Essential for debugging PDF processing failures. |
| Prisma Studio | Database GUI | `pnpm prisma studio` — zero-config admin UI. Saves hours of manual SQL during development. |

---

## Installation

```bash
# Monorepo root
pnpm init
pnpm add -D turbo typescript @types/node

# apps/web — Next.js
pnpm add next@15 react@19 react-dom@19
pnpm add @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
pnpm add next-auth@5 @auth/prisma-adapter
pnpm add zod react-hook-form @hookform/resolvers
pnpm add zustand
pnpm add @react-pdf-viewer/core @react-pdf-viewer/default-layout react-pdf-highlighter
pnpm add stripe resend react-email @react-email/components
pnpm add @anthropic-ai/sdk

# apps/api — Fastify
pnpm add fastify @fastify/cors @fastify/multipart @fastify/redis
pnpm add socket.io
pnpm add bullmq
pnpm add @bull-board/fastify @bull-board/api
pnpm add sharp @hyzyla/pdfium
pnpm add stripe  # webhook handler

# packages/db — Prisma
pnpm add prisma @prisma/client
pnpm add -D prisma

# apps/mobile — Expo
pnpm add expo@sdk-53
pnpm add @nozbe/watermelondb
pnpm add expo-camera expo-file-system expo-image-picker
pnpm add @tanstack/react-query zustand

# Shared dev dependencies
pnpm add -D vitest eslint prettier
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15 | Remix | Remix has better nested loader patterns, but smaller ecosystem and Next.js 15 Turbopack erases the dev speed gap. Choose Remix if you hate Server Actions — ObraVision uses them heavily. |
| Fastify | Hono | Use Hono if deploying to Cloudflare Workers or Deno Deploy. On Railway (Node.js), Fastify's deeper plugin ecosystem wins. |
| Fastify (separate) | Next.js API Routes only | API Routes are fine for simple CRUD, but Socket.io and BullMQ need a persistent Node.js process — not serverless functions. The hybrid (Next.js for web, Fastify for API) is the right call. |
| Prisma | Drizzle ORM | Use Drizzle if deploying to Cloudflare Workers (Prisma's bundle is too large for edge). On Railway Node.js, Drizzle's SQL-proximity is overkill complexity for a solo dev. Drizzle also lacks Prisma Studio. |
| Socket.io | Liveblocks | Use Liveblocks if you have budget ($99+/month) and want presence, cursors, and CRDTs out of the box. At MVP, Socket.io + custom presence logic is sufficient and free. |
| Socket.io | Ably | Use Ably if you need guaranteed message delivery to offline clients without building your own retry logic. At MVP scale, Socket.io is sufficient. |
| Cloudflare R2 | AWS S3 | Use S3 if you are already deeply in the AWS ecosystem. R2's zero-egress cost is decisive for a PDF-heavy app on a bootstrapper budget. |
| WatermelonDB | Expo SQLite (direct) | Use Expo SQLite directly only if your offline data model is simple (< 3 tables, no sync). For ObraVision's diary + sync requirements, WatermelonDB's built-in sync protocol saves weeks of custom work. |
| Resend | SendGrid | Use SendGrid at > 100K emails/month or if you need marketing campaigns. Resend's React Email integration is superior DX for a solo dev. |
| BullMQ | pg-boss | Use pg-boss only if you cannot add Redis. Since Redis is already required for Socket.io scaling, BullMQ costs nothing extra and has a better UI. |
| tRPC | REST (Next.js API routes) | Use REST for the public API endpoints (Phase 4 — ERP integrations). tRPC is internal only. Do not expose tRPC publicly — callers cannot use it without your TypeScript types. |
| Auth.js v5 | Lucia Auth | Use Lucia if you want full control over session implementation. Auth.js v5 (stable) is faster to ship and has battle-tested Google OAuth + Prisma adapter. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Express | No TypeScript-first design, 6x slower than Fastify, no schema validation built-in, effectively in maintenance mode for new SaaS | Fastify 5 |
| Mongoose / TypeORM | No first-class PostgreSQL support (Mongoose is MongoDB-only), TypeORM's decorator magic breaks with strict TypeScript 5.x | Prisma 5 |
| Redux / Redux Toolkit | 40% larger bundle than Zustand + TanStack Query combo. For a SaaS reading mostly server data, Redux's global client store is the wrong primitive. | Zustand + TanStack Query |
| PSPDFKit / Apryse | Commercial PDF SDK. Excellent features, but $300-$1000/month minimum. The react-pdf + react-pdf-highlighter open-source combination covers ObraVision's MVP annotation needs for free. | react-pdf + react-pdf-highlighter |
| GraphQL (Hasura, Apollo) | Significant operational complexity for a solo dev. tRPC gives equivalent type safety with 90% less setup. GraphQL shines when multiple external teams consume the same API — not relevant at MVP. | tRPC (internal) + REST (public API) |
| Next.js Pages Router | End of active development. App Router is the standard for all new Next.js 15 projects. Pages Router still works but receives no new features. | App Router |
| Firebase / Supabase (as full backend) | Lock-in risk and limited customization for domain-specific logic (NBR checklists, Gantt critical path calculation, PDF processing pipelines). Use PostgreSQL + Prisma directly. | PostgreSQL + Prisma + Fastify |
| Capacitor (for mobile) | Forces web-in-webview architecture; offline SQLite is harder to sync than WatermelonDB's native layer. Expo with EAS Build gives true native output with better DX. | Expo SDK 53 |
| React Native CLI (bare) | No managed build pipeline; requires Xcode/Android Studio knowledge for every native dependency. Solo dev loses weeks. | Expo managed workflow + EAS Build |
| AWS (EC2, ECS, RDS) | Operational overhead is too high for a solo dev at MVP. Railway or Render provides comparable reliability with zero DevOps. Move to AWS when you have DevOps budget. | Railway (API + DB) + Vercel (Next.js) + Cloudflare R2 |

---

## Stack Patterns by Variant

**For the PDF viewer with anchored annotations:**
- Render PDF with `react-pdf` (PDF.js canvas-based)
- Overlay annotation pins using `react-pdf-highlighter`'s coordinate system
- Store `{page, x, y}` in PostgreSQL `annotations` table with thread references
- Pre-render pages server-side with `@hyzyla/pdfium + sharp` for PDFs > 10MB to avoid client-side parse delays
- Because: annotation coordinate systems between client and server must be identical; building a custom overlay on raw PDF.js is error-prone

**For offline mobile (field diary):**
- WatermelonDB as local SQLite store
- Custom sync adapter calling your Fastify `/sync/pull` and `/sync/push` endpoints
- Expo's `expo-file-system` to queue photo uploads for when connectivity returns
- Because: canteiro de obras (construction sites) in Brazil have poor 3G connectivity; the app must be fully functional offline and sync opportunistically

**For real-time notifications and collaboration:**
- Socket.io on Fastify with Redis adapter (`@socket.io/redis-adapter`)
- Room-based: each obra gets its own Socket.io room (`obra:${obraId}`)
- Emit events on: new annotation, task status change, diary entry, file upload complete
- Because: WebSocket connections are long-lived and need to be on the same persistent process (Fastify), not serverless Next.js routes

**For PDF reports (exportable obra report):**
- Use `@react-pdf/renderer` (different from the viewer — this one generates PDFs) for server-side report generation
- Run as a BullMQ job: generate PDF → upload to R2 → send download link via email
- Because: report generation can take 30+ seconds for large obras; synchronous API calls will time out

**For the public API (Phase 4 — ERP integrations):**
- Fastify REST endpoints under `/api/v1/`
- API key authentication (not JWT — simpler for ERP integrations)
- OpenAPI spec generated from Fastify's schema system
- Because: external ERP systems cannot use tRPC; REST with OpenAPI spec is universally consumable

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15 | React 19, Auth.js v5, tRPC v11 | React 18 also works but you lose React 19 compiler benefits |
| Auth.js v5 | Next.js 15 App Router, Prisma adapter | Auth.js v4 ("next-auth") had App Router issues; v5 is the rewrite for App Router |
| tRPC v11 | TanStack Query v5, Next.js 15 | tRPC v10 does NOT work cleanly with TanStack Query v5 — use v11 |
| WatermelonDB | Expo SDK 53, React Native 0.79 | Expo Config plugin handles native setup; do NOT attempt to manually link |
| Prisma 5 | PostgreSQL 14-16, Node.js 18+ | Prisma 6+ (late 2025) removes Rust engine; if starting mid-2026, check current major |
| Socket.io 4 | Fastify 5, @socket.io/redis-adapter 8 | Use the Fastify adapter (`@fastify/websocket` not needed — socket.io brings its own) |
| BullMQ 5 | Redis 6+, Node.js 18+ | Requires Redis — do not attempt with Redis 5 or lower |
| react-pdf-highlighter | react-pdf v7+ | Peer dependency; verify versions match when installing |

---

## Infrastructure Topology

```
Vercel                    Railway                   Cloudflare
──────────────            ────────────────          ──────────
Next.js 15     ──tRPC──▶  Fastify API        ──────▶  R2 (PDFs, photos)
(Web Frontend)            ├─ Socket.io WS
                          ├─ BullMQ workers
                          ├─ Stripe webhooks
                          ├─ PostgreSQL 16
                          └─ Redis 7

                          Expo EAS
                          ──────────────────
                          React Native app
                          └─ WatermelonDB (SQLite)
                             ↕ sync over HTTPS to Fastify
```

**Hosting rationale:**
- Vercel for Next.js: CDN edge, zero config, free tier is generous for frontend
- Railway for everything else: single platform for API + DB + Redis, Brazil São Paulo region available (sa-east-1 equivalent), free tier covers MVP launch
- Cloudflare R2: zero egress fees are decisive for a PDF-heavy app; R2 is in São Paulo PoP

---

## Sources

- Next.js 15 release blog (nextjs.org/blog) — confirmed Turbopack stable, React 19 support
- Medium: "Next.js 15 vs Next.js 14: Performance Comparison and Migration Guide 2026" — MEDIUM confidence (community article)
- BetterStack: "Fastify vs Express vs Hono" (betterstack.com) — MEDIUM confidence, benchmarks verified against fastify.dev
- Fastify.dev benchmarks — HIGH confidence (official)
- Bytebase: "Drizzle ORM vs Prisma" (bytebase.com/blog/drizzle-vs-prisma/) — MEDIUM confidence
- Supabase blog: "Offline-first React Native Apps with Expo, WatermelonDB" — HIGH confidence (official Supabase)
- Expo docs: "Local-first architecture" (docs.expo.dev/guides/local-first/) — HIGH confidence (official)
- Expo SDK 53 changelog (expo.dev/changelog/sdk-53) — HIGH confidence (official)
- Stripe docs: PIX payments (docs.stripe.com/payments/pix) — HIGH confidence (official)
- Cloudflare R2 vs S3 comparison (cloudflare.com/pg-cloudflare-r2-vs-aws-s3/) — HIGH confidence (official)
- tRPC docs: Next.js integration (trpc.io/docs/client/nextjs) — HIGH confidence (official)
- react-pdf GitHub (github.com/wojtekmaj/react-pdf) — HIGH confidence (official)
- react-pdf-highlighter GitHub (github.com/agentcooper/react-pdf-highlighter) — MEDIUM confidence (community maintained, verify activity before adopting)
- @hyzyla/pdfium npm (npmjs.com/package/@hyzyla/pdfium) — MEDIUM confidence (smaller library, verify maintenance status)
- BullMQ (bullmq.io) — HIGH confidence (official)
- Auth.js v5 — verify stable release status at authjs.dev at project start

---

*Stack research for: ObraVision — Construction Management SaaS (Brazil)*
*Researched: 2026-03-13*
