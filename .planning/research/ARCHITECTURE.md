# Architecture Research

**Domain:** Construction Management SaaS (visual collaboration on construction plans)
**Researched:** 2026-03-13
**Confidence:** HIGH (multi-tenancy, WebSocket, background jobs) / MEDIUM (offline mobile sync, PDF annotation overlay)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌───────────────────┐  ┌──────────────────────┐  │
│  │    Web App           │  │   Mobile App       │  │   Client Portal      │  │
│  │    (Next.js)         │  │   (Expo RN)        │  │   (Next.js read-only)│  │
│  │  PDF Viewer          │  │  Offline-first     │  │  Shared link access  │  │
│  │  Annotation UI       │  │  Camera/diary      │  │  No auth required    │  │
│  └──────────┬───────────┘  └────────┬──────────┘  └──────────┬───────────┘  │
│             │ HTTPS/WSS             │ HTTPS                   │ HTTPS        │
├─────────────┼─────────────────────-─┼─────────────────────────┼──────────────┤
│                              API LAYER                                       │
├─────────────┼───────────────────────┼─────────────────────────┼──────────────┤
│  ┌──────────┴───────────────────────┴─────────────────────────┴───────────┐  │
│  │                      API Server (Fastify)                               │  │
│  │   ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │   │ REST routes│  │ WebSocket  │  │ Auth plugin  │  │ Multi-tenant  │  │  │
│  │   │ /api/v1    │  │ /ws        │  │ (JWT + OAuth)│  │ middleware    │  │  │
│  │   └────────────┘  └────────────┘  └─────────────┘  └───────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────-─┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│                           BACKGROUND LAYER                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Job Queue (BullMQ + Redis)                            │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │ │
│  │  │ PDF Worker  │  │ Weather API  │  │ AI Worker  │  │ Notif Worker  │  │ │
│  │  │ (convert,   │  │ (fetch/cache │  │ (Claude AI │  │ (email/push)  │  │ │
│  │  │  tile, store│  │  daily)      │  │  NBR check)│  │               │  │ │
│  │  └─────────────┘  └──────────────┘  └────────────┘  └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│                             DATA LAYER                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌──────────────────┐  ┌────────────────────────┐   │
│  │  PostgreSQL        │  │  Redis           │  │  Object Storage        │   │
│  │  (Neon/Railway)    │  │  (Upstash/Railway│  │  (Cloudflare R2)       │   │
│  │  + Row-Level Sec.  │  │  cache + queues) │  │  PDFs, photos, exports │   │
│  └────────────────────┘  └──────────────────┘  └────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Web App (Next.js) | PDF viewer with annotation overlay, project management UI, real-time UI updates | Next.js App Router, PDF.js, custom SVG/canvas annotation layer |
| Mobile App (Expo RN) | Offline-capable diary, camera integration, push notifications, field-first UI | Expo, SQLite (local), background sync |
| Client Portal | Read-only project view via shared link, no account required | Next.js static/dynamic route, token-gated access |
| API Server (Fastify) | REST endpoints, WebSocket hub, auth, multi-tenant resolution, billing enforcement | Fastify with plugins for WebSocket, auth, schema validation |
| PDF Worker | Receive upload, convert to pages (PNG/WebP), generate tiles, store in R2, update DB | Sharp or Ghostscript, BullMQ queue consumer |
| Weather Worker | Daily cron fetching weather data per active project location, cache in Redis/DB | BullMQ repeatable job, OpenWeather API |
| AI Worker | Run NBR compliance checks via Claude API, cache results, enforce plan-tier limits | BullMQ queue consumer, Anthropic SDK |
| Notification Worker | Send email/push notifications on annotations, mentions, task updates | BullMQ consumer, Resend/Expo Push API |
| PostgreSQL | Persistent data with row-level security enforcing tenant isolation | Neon (serverless Postgres) or Railway Postgres |
| Redis | WebSocket session state, BullMQ job storage, short-lived cache (weather, AI results) | Upstash Redis (serverless) or Railway Redis |
| Object Storage (R2) | PDFs, converted page images, diary photos, exported reports | Cloudflare R2 (zero egress fees, S3-compatible) |

## Recommended Project Structure

```
projetapro/                          # monorepo root
├── apps/
│   ├── web/                         # Next.js web app
│   │   ├── app/                     # App Router pages
│   │   │   ├── (auth)/              # Login, register, OAuth
│   │   │   ├── (dashboard)/         # Protected: projects, tasks
│   │   │   ├── viewer/[id]/         # PDF viewer + annotation
│   │   │   └── portal/[token]/      # Public client portal
│   │   ├── components/
│   │   │   ├── pdf/                 # PDFViewer, AnnotationLayer, Pin
│   │   │   ├── realtime/            # WebSocket provider, presence
│   │   │   └── ui/                  # Shared design system
│   │   └── lib/
│   │       ├── ws-client.ts         # WebSocket client singleton
│   │       └── api-client.ts        # Type-safe API client
│   │
│   ├── api/                         # Fastify API server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/            # JWT, OAuth, session
│   │   │   │   ├── projects/        # CRUD, members, roles
│   │   │   │   ├── plans/           # PDF upload, versioning
│   │   │   │   ├── annotations/     # Pins, threads, real-time
│   │   │   │   ├── diary/           # Daily logs, photos, weather
│   │   │   │   ├── tasks/           # Schedule, Gantt, Kanban
│   │   │   │   ├── billing/         # Stripe, plans, obra limits
│   │   │   │   └── ai/              # NBR check endpoint
│   │   │   ├── plugins/
│   │   │   │   ├── tenant.ts        # Tenant resolution middleware
│   │   │   │   ├── auth.ts          # JWT validation plugin
│   │   │   │   └── rls.ts           # Set app.tenant_id on each request
│   │   │   ├── queues/
│   │   │   │   ├── pdf.queue.ts     # PDF processing jobs
│   │   │   │   ├── weather.queue.ts # Weather fetch jobs
│   │   │   │   └── ai.queue.ts      # AI analysis jobs
│   │   │   └── ws/
│   │   │       └── hub.ts           # WebSocket connection manager
│   │   └── workers/                 # Separate process (not in API)
│   │       ├── pdf.worker.ts        # PDF conversion consumer
│   │       ├── weather.worker.ts    # Weather cron consumer
│   │       └── ai.worker.ts         # Claude API consumer
│   │
│   └── mobile/                      # Expo React Native
│       ├── app/                     # Expo Router screens
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   │   ├── diary/           # Daily log entry + camera
│       │   │   └── projects/        # Project list + tasks
│       │   └── _layout.tsx
│       ├── lib/
│       │   ├── db/                  # SQLite schema (offline store)
│       │   ├── sync/                # Pull/push sync engine
│       │   └── camera.ts            # Photo capture + compression
│       └── hooks/
│           └── useOfflineSync.ts
│
├── packages/
│   ├── types/                       # Shared TypeScript types + Zod schemas
│   │   └── src/
│   │       ├── api.ts               # API request/response types
│   │       ├── annotations.ts       # Annotation coordinate types
│   │       └── ws-events.ts         # WebSocket event contract
│   ├── db/                          # Drizzle ORM schema + migrations
│   │   └── src/
│   │       ├── schema/              # Table definitions
│   │       └── migrations/
│   └── config/                      # Shared ESLint, TS, Prettier config
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Structure Rationale

- **apps/api/workers/:** Workers run as a separate process to isolate heavy CPU/memory work (PDF conversion, AI calls) from the HTTP server. Same codebase, different entry point.
- **packages/types/:** Single source of truth for all type contracts. Both API and clients import from here — no drift between what the server sends and clients expect.
- **packages/db/:** Drizzle schema lives in a shared package so workers can import the same DB client as the API without duplicating schema definitions.
- **apps/web/app/viewer/:** PDF viewer is isolated under its own route segment because it has unique dependencies (PDF.js, WebSocket subscription, annotation state) that shouldn't pollute the rest of the app.

## Architectural Patterns

### Pattern 1: Shared Schema Multi-Tenancy with Row-Level Security

**What:** All tenants share one PostgreSQL database and one schema. Every table has a `tenant_id` column. PostgreSQL RLS policies act as invisible WHERE clauses, filtering data automatically based on a session variable set per request.

**When to use:** Optimal for solo-dev SaaS up to ~50k tenants. Eliminates per-tenant setup overhead, reduces infrastructure cost, and keeps migration management simple.

**Trade-offs:** RLS adds a small query overhead (~5-10%). Complex cross-tenant admin queries require bypassing RLS (use a superuser role carefully). Column-level security requires application-layer enforcement.

**Example:**
```typescript
// api/plugins/rls.ts — runs on every authenticated request
fastify.addHook('preHandler', async (req) => {
  const tenantId = req.user.tenantId;
  await db.execute(
    sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`
  );
});
```
```sql
-- Applied to every table
CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Pattern 2: Annotation Overlay as a Separate SVG Layer

**What:** PDF.js renders the PDF to a canvas element. A transparent SVG/div layer is positioned absolutely on top of the canvas. Annotation pins are SVG elements with coordinates stored as normalized percentages (0–1 range) relative to the page dimensions. On render, coordinates are multiplied by actual page pixel dimensions.

**When to use:** Any PDF annotation system needing persistent, zoom-resilient pin placement that syncs across users.

**Trade-offs:** Normalized coordinates handle zoom and resize gracefully, but require transformation math when placing new pins. Custom layer is more flexible than PDF.js's built-in annotation editor (which only supports 4 types and saves back into the PDF binary).

**Example:**
```typescript
// Storing normalized coordinates
type AnnotationPin = {
  id: string;
  pageNumber: number;
  x: number; // 0.0 to 1.0 (percent of page width)
  y: number; // 0.0 to 1.0 (percent of page height)
};

// Rendering to screen coordinates
function toScreenCoords(pin: AnnotationPin, pageRect: DOMRect) {
  return {
    left: pin.x * pageRect.width,
    top: pin.y * pageRect.height,
  };
}
```

### Pattern 3: WebSocket Hub with Room-Based Broadcasting

**What:** The Fastify WebSocket server maintains a Map of `projectId -> Set<WebSocket>`. When any client sends an annotation event, the hub broadcasts to all other clients in the same project room. Redis pub/sub enables broadcasting across multiple API server instances.

**When to use:** Required for real-time annotation collaboration. The room abstraction keeps message scoping simple and tenant-safe.

**Trade-offs:** Requires sticky sessions at the load balancer, or Redis pub/sub to relay messages across nodes. For a solo-dev early product, a single server instance removes this complexity entirely.

**Example:**
```typescript
// ws/hub.ts
const rooms = new Map<string, Set<WebSocket>>();

function broadcast(projectId: string, event: WsEvent, exclude?: WebSocket) {
  const room = rooms.get(projectId) ?? new Set();
  for (const client of room) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  }
}
```

### Pattern 4: Offline-First Mobile with Optimistic Sync

**What:** Mobile app reads and writes exclusively to a local SQLite database. A background sync engine periodically pushes pending writes and pulls server changes. Conflict resolution uses last-write-wins by server timestamp for non-collaborative data (diary entries are user-owned and rarely conflict).

**When to use:** Required for field use in construction sites with poor connectivity. Diary entries, photos, and task status updates are good candidates. Annotation pins are not offline-ready in early phases (too complex to merge).

**Trade-offs:** Simpler than CRDT-based sync. Adequate for "one user owns one diary entry" use cases. Will not handle concurrent edits from two users to the same record without user-visible conflict prompts.

## Data Flow

### Request Flow: Creating an Annotation Pin

```
User clicks on PDF page
    ↓
AnnotationLayer captures click → computes normalized (x, y)
    ↓
HTTP POST /api/v1/projects/:id/annotations  [REST]
    ↓
API: validate auth + tenant RLS → insert row → return annotation
    ↓
API: publish WS event to project room hub
    ↓
All connected clients receive { type: 'pin.created', payload: annotation }
    ↓
Each client renders new pin on their annotation SVG layer
```

### Request Flow: PDF Upload and Processing

```
User uploads PDF via web app
    ↓
Web app: POST /api/v1/plans (multipart form)
    ↓
API: stream file directly to Cloudflare R2 (presigned URL upload)
    ↓
API: insert plan record in DB (status: 'processing')
    ↓
API: enqueue job { planId, r2Key } in BullMQ pdf queue
    ↓
PDF Worker: pull job → download PDF from R2
    ↓
Worker: convert each page to WebP with Sharp/Ghostscript
    ↓
Worker: upload page images to R2 (under /pages/{planId}/)
    ↓
Worker: update plan record in DB (status: 'ready', pageCount, pagePaths)
    ↓
Worker: push WS event → plan.ready → client re-fetches viewer
```

### Request Flow: Offline Mobile Sync

```
Field worker enters diary entry (offline)
    ↓
SQLite insert: diary_entries (synced: false, localId: uuid)
    ↓
[Connection restored]
    ↓
Sync engine: query WHERE synced = false
    ↓
HTTP POST /api/v1/diary/sync  (batch payload)
    ↓
API: upsert records, return server IDs
    ↓
SQLite update: set synced = true, serverId = returned id
```

### Key Data Flows

1. **Annotation collaboration:** Client → REST (create) → DB → WS broadcast → all clients. REST for mutation (auditable), WS for delivery (low latency).
2. **PDF page delivery:** Upload → R2 raw storage → Worker conversion → R2 page images → CDN-cached delivery to PDF viewer.
3. **AI check:** User triggers → API enqueues job → Worker calls Claude API → result cached in Redis (24h) + stored in DB → API returns result to client.
4. **Weather integration:** BullMQ repeatable job (nightly) → OpenWeather API → store in `project_weather` table → diary auto-populates on entry creation.
5. **Billing enforcement:** API middleware reads tenant plan from DB (Redis-cached) → checks active obra count / feature flags before allowing writes.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 obras (single dev MVP) | Monolith: Next.js + Fastify on Railway. Workers as child processes in same dyno. Single Postgres. Cloudflare R2. No Redis needed — pg-boss instead. |
| 500-5k obras | Add Redis (Upstash) for BullMQ. Separate worker dyno. Neon serverless Postgres for connection pooling. Add CDN in front of R2 page images. |
| 5k-50k obras | Horizontal scale API instances behind load balancer (sticky sessions for WS). Redis pub/sub for cross-instance WS broadcasting. Read replicas for DB. |
| 50k+ obras | Evaluate dedicated WebSocket service (Soketi/Ably). Partition PDF processing by tenant tier. Multi-region if international expansion. |

### Scaling Priorities

1. **First bottleneck:** PDF processing at concurrent uploads — saturates CPU on API server. Fix: move workers to separate dyno immediately at 500+ users.
2. **Second bottleneck:** WebSocket connection count on single server — fix: Redis pub/sub + multiple API instances with sticky sessions at load balancer.
3. **Third bottleneck:** PostgreSQL connection count — fix: Neon serverless or PgBouncer pooling, which handles connection spikes from serverless/workers.

## Anti-Patterns

### Anti-Pattern 1: Storing Annotations in the PDF Binary

**What people do:** Use PDF.js annotation editor to save annotations back into the PDF file on each change.

**Why it's wrong:** Creates a new PDF version on every comment. Breaks version history (annotations entangled with plan revisions). Sharing the PDF loses app-specific metadata. Storage costs multiply with annotation frequency.

**Do this instead:** Store annotations in PostgreSQL with normalized page coordinates. Render as an SVG overlay layer. The PDF itself is immutable — only new plan revisions create new PDF versions.

### Anti-Pattern 2: Synchronous PDF Processing in the Request Cycle

**What people do:** When the user uploads a PDF, process it (convert, tile, store) in the API request handler before returning a response.

**Why it's wrong:** Large PDFs (>50MB, common in architecture drawings) can take 30-120 seconds to process. Request timeouts at 30s will kill the upload. The user is blocked and gets a false failure.

**Do this instead:** Accept the upload, stream to R2, immediately return `{ status: 'processing' }`. Enqueue a background job. The client polls or receives a WebSocket notification when ready.

### Anti-Pattern 3: Database-per-Tenant for a Solo-Dev Bootstrap

**What people do:** Give each construction company its own PostgreSQL schema or database for "maximum isolation."

**Why it's wrong:** Schema-per-tenant means running migrations across N schemas on every deploy. At 100 tenants this is painful; at 1000 it breaks. Dramatically increases operational overhead for a solo dev.

**Do this instead:** Shared schema with RLS. Isolates data correctly, runs one migration, maintains one connection pool. Schema-per-tenant is for regulated industries (healthcare, finance) needing contractual data separation, which construction SaaS typically does not require.

### Anti-Pattern 4: Real-Time Everything via WebSocket

**What people do:** Push all data updates (task lists, billing info, project metadata) through WebSocket connections.

**Why it's wrong:** WebSocket state is volatile. If connection drops, the client misses events. Non-real-time data sent over WS needs additional reconciliation logic. Adds complexity without proportional benefit.

**Do this instead:** Use WebSocket only for low-latency collaboration events (annotation pins, presence cursors, notification toasts). Use REST + SWR/TanStack Query with polling or cache invalidation for everything else. WebSocket events can trigger a cache invalidation to prompt a REST re-fetch.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Cloudflare R2 | S3-compatible SDK (`@aws-sdk/client-s3`), presigned URLs for direct client upload | Zero egress fees ideal for large PDFs. Enable public bucket access for page images via CDN. |
| BullMQ (Redis-backed) | Enqueue from API via `queue.add()`, consume in separate worker process | Workers in `/apps/api/workers/` — separate entry point, same package |
| Claude AI (Anthropic) | HTTP call from AI worker, response cached in Redis (24h TTL) + stored in DB | Enforce per-plan tier limits at API layer before enqueueing job. Never call Claude in request path. |
| OpenWeather API | BullMQ repeatable job, stores results in `project_weather` table | Cache: one API call per project location per day. Free tier: 1000 calls/day. |
| Stripe | Webhooks for subscription events (`customer.subscription.updated`), plan stored in tenant record | Validate webhook signature. Sync plan to Redis cache for fast middleware enforcement. |
| Expo Push Notifications | Push tokens stored per device in DB, Notification Worker calls Expo Push API in batches | Never send push from API request path — always enqueue to notification worker. |
| Google OAuth | Fastify OAuth2 plugin, exchange code for token, upsert user in DB | Store only profile info (name, email, avatar). No Google token persistence needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Web App ↔ API | REST HTTP + WebSocket | REST for mutations/queries, WS for real-time events only |
| Mobile App ↔ API | REST HTTP only | WebSocket deferred to later phase — offline sync takes priority |
| API ↔ Workers | BullMQ job queue (via Redis) | Workers are isolated processes. Never call workers directly via function calls. |
| API ↔ DB | Drizzle ORM + `pg` pool | RLS enforced via session variable on every connection checkout |
| Workers ↔ DB | Same Drizzle schema, separate pool (no RLS — workers use service role) | Workers do admin operations (update status, bulk inserts) bypassing RLS intentionally |
| Workers ↔ R2 | S3 SDK from `@aws-sdk/client-s3` | Workers download raw PDF, upload processed pages |
| API ↔ Redis | `ioredis` — two uses: BullMQ job broker, key-value cache | Separate Redis databases (index 0 for BullMQ, index 1 for cache) to avoid key collisions |

## Build Order Implications

Based on component dependencies, phases should be built in this order:

1. **Foundation first:** PostgreSQL schema + RLS + tenant model + auth. Everything else depends on this. Skipping auth or multi-tenancy setup here forces painful retrofits.

2. **File storage before PDF viewer:** R2 integration and upload flow must work before the viewer can display anything. PDF worker (conversion to pages) unlocks the viewer.

3. **REST API before WebSocket:** WebSocket hub depends on knowing which project a user belongs to — that's auth + project membership, which are REST concerns. Implement REST routes first, add WS broadcasting as an enhancement.

4. **Web viewer before mobile:** PDF annotation is the core differentiator. Validate it works well on web before investing in mobile. Mobile focuses on diary/field tasks that don't require the annotation system.

5. **Background workers before AI features:** The worker infrastructure (BullMQ + Redis) must exist before plugging in AI or weather integrations. AI and weather are just new queue consumers in an existing system.

6. **Billing last in MVP phase:** Stripe integration depends on having a working product to sell. Implement billing only after core features are validated with beta users.

## Sources

- [SaaS Architecture Patterns with Next.js](https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs) — multi-tenancy, RLS, subdomain routing (MEDIUM confidence)
- [Shipping multi-tenant SaaS using PostgreSQL RLS](https://www.thenile.dev/blog/multi-tenant-rls) — RLS implementation patterns (HIGH confidence)
- [Multi-tenant data isolation with PostgreSQL RLS — AWS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/) — official AWS guidance (HIGH confidence)
- [BullMQ official docs](https://docs.bullmq.io) — job queue patterns (HIGH confidence)
- [Node.js Job Queue with pg-boss](https://talent500.com/blog/nodejs-job-queue-postgresql-pg-boss/) — pg-boss as Redis-free alternative (MEDIUM confidence)
- [Yjs WebSocket Server Guide — Velt](https://velt.dev/blog/yjs-websocket-server-real-time-collaboration) — WebSocket + CRDT collaboration patterns (MEDIUM confidence)
- [WebSocket Scale in 2025 — VideoSDK](https://www.videosdk.live/developer-hub/websocket/websocket-scale) — sticky sessions, Redis pub/sub at scale (MEDIUM confidence)
- [Using PDF.js Layers in React.js](https://blog.react-pdf.dev/understanding-pdfjs-layers-and-how-to-use-them-in-reactjs) — layer architecture (canvas, text, annotation) (HIGH confidence)
- [Offline-First Architecture with SQLite in React Native](https://www.innovationm.com/blog/react-native-offline-first-architecture-sqlite-local-database-guide/) — offline-first patterns (MEDIUM confidence)
- [Cloudflare R2 overview](https://developers.cloudflare.com/r2/) — object storage, zero egress fees (HIGH confidence)
- [2025 Monorepo — Turborepo + pnpm + Next.js + Expo](https://medium.com/@TheblogStacker/2025-monorepo-that-actually-scales-turborepo-pnpm-for-next-js-ab4492fbde2a) — monorepo structure (MEDIUM confidence)

---
*Architecture research for: Construction Management SaaS (ProjetaPro)*
*Researched: 2026-03-13*
