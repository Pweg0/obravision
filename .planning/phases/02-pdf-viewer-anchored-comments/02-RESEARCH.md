# Phase 2: PDF Viewer + Anchored Comments - Research

**Researched:** 2026-03-13
**Domain:** PDF rendering pipeline, anchored annotations, real-time WebSocket notifications
**Confidence:** HIGH (core stack verified via npm registry + official docs), MEDIUM (Socket.io/Fastify 5 integration — requires custom plugin)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Viewer Experience**
- Viewer embedded in obra page (large panel), NOT full-screen — obra sidebar/nav stays visible
- Horizontal toolbar at top with zoom, page navigation, and actions
- Single-page navigation with prev/next arrows and page selector in toolbar (no continuous scroll)
- Technical approach for large PDFs (>50MB) is Claude's discretion — must be fast

**Pin & Comment Interaction**
- Creation flow: click places temporary pin, popup asks "Adicionar comentario aqui?" with text field, cancel removes pin
- Threads appear in right sidebar (Figma style) — viewer shrinks to give space
- Sidebar hidden by default — only appears when a pin is selected
- Pins identified visually by author avatar/initial (not numbers or colors)
- No open/resolved status in v1 — all pins are equal
- Soft delete for pins and comments — shows "removed" but history stays in DB
- Permissions: Admin + Engenheiro create pins and comment. Cliente is read-only

**Revision Management**
- Revision navigation via dropdown in toolbar: "R2 (current) ▾"
- On new revision upload, prompt "Migrar pins da revisao anterior?" — Yes copies pins, No starts clean
- Mandatory changelog field when uploading new revision
- Upload permission: Admin + Engenheiro
- Admin can delete entire plant or specific revision (soft delete, restorable for 30 days)

**Plant Organization in Obra**
- Plants grouped by type/discipline on obra page
- Pre-defined types (Arquitetura, Estrutural, Eletrica, Hidraulica, Incendio, Topografia) + custom types
- Within each group, list of plants with their revisions

**Real-Time Notifications**
- Toast popup + numeric badge on navbar bell + discrete notification sound
- NO live pins — user receives notification and must refresh/click to see new pins
- Notification center: dropdown on bell shows 5 most recent + "Ver todas" link
- Events: new pin, new reply in thread I participated in, new plant revision, @mention in comment
- @mention system in comments with directed notification

### Claude's Discretion
- Technical approach for rendering large PDFs (PDF.js direct vs server-side conversion vs hybrid)
- Exact component design (pins, sidebar, toolbar, revision dropdown)
- Loading states and skeletons
- Cache and performance strategy for PDFs
- Exact layout of dedicated notifications page
- Toast notification animation/transition
- Notification sound format

### Deferred Ideas (OUT OF SCOPE)
- Email notifications when someone comments on a plant — v2
- WhatsApp notifications — v2
- Live pins in real-time in viewer (Figma style) — v2, for now only notification + refresh
- Open/resolved pin status — v2
- Side-by-side revision comparison — v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLNT-01 | User can upload plantas in PDF format | R2 multipart upload via @aws-sdk/client-s3 + server action presigned URL flow |
| PLNT-02 | User can view plantas in full-screen PDF viewer with zoom and navigation | react-pdf (wojtekmaj) v9 + pdfjs-dist 4.x, canvas rendering + custom SVG overlay |
| PLNT-03 | User can create new plant revisions (R0, R1, R2) with changelog | Prisma Planta + PlantaRevisao models, revision FK, changelog required field |
| PLNT-04 | User can click on any point to create an anchored comment with pin and thread | Normalized (0.0–1.0) coordinate system on SVG overlay div over PDF canvas |
| PLNT-05 | User receives real-time notifications when new comments are added via WebSocket | Socket.io attached directly to Fastify's underlying Node.js HTTP server, rooms per obra |
</phase_requirements>

---

## Summary

Phase 2 implements three distinct technical subsystems that must compose together: (1) a PDF rendering pipeline that handles large files (>50MB) efficiently, (2) a coordinate-stable pin annotation system that survives zoom and resize, and (3) a real-time notification hub using Socket.io.

The recommended approach for PDF rendering is a **hybrid strategy**: for files <= 5MB, render directly in the browser with `react-pdf` (wojtekmaj v9 wrapping pdfjs-dist 4.x); for larger files, use a BullMQ job queue in the Fastify API to convert pages to WebP tiles server-side via `@hyzyla/pdfium` + `sharp`, storing tiles in R2. This avoids shipping 50MB+ PDFs to the browser and delivers near-instant tile loading. Pin coordinates must be stored as normalized (0.0–1.0) floats relative to page dimensions — this makes them zoom/resize/DPI-invariant and DPR-independent.

The Socket.io integration with Fastify 5 requires a custom plugin because `fastify-socket.io` is not maintained for Fastify 5 (issue open since Oct 2024, largely abandoned as of Feb 2026). The solution is to attach `socket.io` directly to Fastify's underlying `server.server` Node.js HTTP instance, which is both documented and proven. The Next.js client must initialize the socket connection in a `useEffect` inside a Context Provider marked `"use client"`.

**Primary recommendation:** Use `react-pdf` v9 for the browser viewer + `@hyzyla/pdfium` BullMQ pipeline for large files + normalized SVG overlay for pins + Socket.io attached directly to Fastify's HTTP server.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-pdf (wojtekmaj) | ^9.2.x | React wrapper for PDF.js — `<Document>` + `<Page>` components | Actively maintained, React 19 compatible, handles worker setup |
| pdfjs-dist | ^4.x (pinned by react-pdf) | Mozilla PDF.js engine — canvas rendering, viewport, text layer | Industry standard for browser PDF rendering |
| @hyzyla/pdfium | ^2.1.12 | Server-side PDF → image conversion via PDFium WASM | 42k weekly downloads, last published ~11 days ago, zero native deps |
| sharp | ^0.33.x | Convert PDFium bitmap output to WebP with quality control | Fastest Node.js image processing, direct WebP output |
| bullmq | ^5.x | Redis-backed job queue for PDF conversion pipeline | TypeScript-first, BullBoard compatible, battle-tested for media pipelines |
| ioredis | ^5.x | Redis connection for BullMQ | Required peer dependency for BullMQ |
| socket.io | ^4.7.x | WebSocket server (rooms, events, namespaces) | Standard for Node.js real-time; Fastify 5 attached directly to HTTP server |
| socket.io-client | ^4.7.x | Browser WebSocket client | Paired with server version |
| @aws-sdk/client-s3 | ^3.x | Cloudflare R2 upload (multipart, presigned URLs) | R2 is S3-compatible; this is already used for coverUrl/logoUrl |
| @aws-sdk/s3-request-presigner | ^3.x | Generate presigned PUT URLs for direct browser upload | Keeps credentials server-side |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @aws-sdk/lib-storage | ^3.x | Streaming multipart upload helper | When piping R2 write from BullMQ worker (WebP tiles upload) |
| sonner | ^1.x (or existing toast) | Toast notification UI | Notification event toasts from socket events |
| use-debounce | ^10.x | Debounce zoom slider input | Avoid excessive re-renders during zoom drag |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-pdf v9 | raw pdfjs-dist | react-pdf gives <Document>/<Page>, handles worker path, canvas sizing; raw pdfjs requires full renderer implementation |
| @hyzyla/pdfium | Poppler (native binary) | Poppler requires system binary install — not suitable for containerized deployment; @hyzyla/pdfium is WASM, zero deps |
| socket.io | native WebSocket | Socket.io adds rooms, reconnection, event names, namespacing — essential for per-obra isolation without manual state management |
| BullMQ | direct async conversion in request | Large PDFs (50MB) would block the API request; queue enables retry, progress tracking, decoupled processing |

### Installation

```bash
# Web app
pnpm add --filter web react-pdf pdfjs-dist socket.io-client

# API app
pnpm add --filter api bullmq ioredis socket.io @hyzyla/pdfium sharp @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/lib-storage
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/
├── app.ts                    # Fastify server — attaches Socket.io to server.server
├── plugins/
│   └── socketio.ts           # Custom Socket.io Fastify plugin (DIY, no npm plugin)
├── queues/
│   ├── pdf-conversion.queue.ts   # BullMQ Queue definition
│   └── pdf-conversion.worker.ts  # BullMQ Worker — pdfium + sharp + R2 upload
└── routes/
    └── plantas.ts            # REST endpoints: presigned URL, revision create

apps/web/app/(dashboard)/dashboard/obras/[id]/
├── page.tsx                  # RSC — fetches obra + plantas
├── ObraDetailClient.tsx      # Client wrapper — SocketProvider
├── plantas/
│   ├── PlantaViewer.tsx       # PDF viewer: react-pdf canvas + SVG overlay
│   ├── PinLayer.tsx           # SVG overlay with normalized coordinate pins
│   ├── PinPopup.tsx           # Temporary pin + comment creation popup
│   ├── ThreadSidebar.tsx      # Figma-style right sidebar with threads
│   ├── PlantaUploadForm.tsx   # Upload form → presigned URL → R2 → server action
│   └── RevisionDropdown.tsx   # Toolbar revision selector

packages/db/prisma/schema.prisma
├── Planta                    # PDF plant record, grouped by disciplina
├── PlantaRevisao             # Revision (R0, R1, R2), FK to Planta
├── Pin                       # Normalized coordinates (x, y, pageNumber)
├── Thread                    # Thread linked to Pin
└── ThreadMessage             # Individual messages in thread
```

---

### Pattern 1: Hybrid PDF Rendering (Small = Direct, Large = Tiles)

**What:** Files <= 5MB are rendered directly in browser via react-pdf. Files > 5MB are queued for server-side conversion to WebP tiles; viewer shows tiles instead of canvas.

**When to use:** Always — the viewer component switches rendering mode based on `planta.tilesReady` flag.

**Why this threshold:** 5MB is well within the browser's comfortable PDF parsing range. Construction plant PDFs are typically 2–50MB, with architectural drawings at the top end.

```typescript
// Source: @hyzyla/pdfium docs (pdfium.js.org/docs/render-pdf)
// apps/api/src/queues/pdf-conversion.worker.ts
import { PDFium } from '@hyzyla/pdfium';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const pdfium = await PDFium();

async function convertPageToWebP(
  pdfBuffer: Buffer,
  pageIndex: number,
  scale: number = 2  // scale 2 = 144 DPI — good quality for construction plans
): Promise<Buffer> {
  const document = await pdfium.loadDocument(pdfBuffer);
  const page = document.pages()[pageIndex];
  const { bitmap } = await page.render({ scale, renderEngine: 'bitmap' });
  await document.destroy();

  // Convert raw RGBA bitmap to WebP via sharp
  return sharp(bitmap.data, {
    raw: { width: bitmap.width, height: bitmap.height, channels: 4 }
  }).webp({ quality: 85 }).toBuffer();
}
```

---

### Pattern 2: Normalized Pin Coordinates (0.0–1.0)

**What:** Store pin position as `x: Float` and `y: Float` where 0.0 = top/left edge of page and 1.0 = bottom/right edge. Convert to/from pixel coordinates using current page dimensions on every render.

**When to use:** Always for persisted pin positions. Never store pixel coordinates.

**Why:** Pixel coordinates depend on zoom level, device pixel ratio, and container width. Normalized coordinates survive all of these.

```typescript
// apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/PinLayer.tsx
// Source: Pattern derived from PDF.js viewport documentation

interface NormalizedPin {
  x: number;  // 0.0–1.0 fraction of page width
  y: number;  // 0.0–1.0 fraction of page height
  pageNumber: number;
}

function clickToNormalized(
  event: React.MouseEvent<HTMLDivElement>,
  containerRef: React.RefObject<HTMLDivElement>
): { x: number; y: number } {
  const rect = containerRef.current!.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

function normalizedToPixels(
  pin: NormalizedPin,
  containerWidth: number,
  containerHeight: number
): { left: number; top: number } {
  return {
    left: pin.x * containerWidth,
    top: pin.y * containerHeight,
  };
}
```

The SVG overlay `<div>` is positioned `absolute` over the PDF canvas with `pointer-events: none` (except for the pin elements themselves). The container div wrapping both canvas and overlay handles click events for new pin creation.

---

### Pattern 3: Socket.io Attached to Fastify 5 HTTP Server

**What:** Since `fastify-socket.io` is abandoned and incompatible with Fastify 5, attach Socket.io directly to Fastify's underlying Node.js HTTP server.

**When to use:** Always with Fastify 5.

```typescript
// Source: Socket.io server initialization docs + Fastify 5 docs
// apps/api/src/app.ts
import Fastify from 'fastify';
import { Server as SocketIOServer } from 'socket.io';

const fastify = Fastify({ logger: true });

// Wait for Fastify to bind its HTTP server
await fastify.ready();

const io = new SocketIOServer(fastify.server, {
  cors: {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  },
});

// Room naming: obra:{obraId}
io.on('connection', (socket) => {
  socket.on('join-obra', (obraId: string) => {
    socket.join(`obra:${obraId}`);
  });
  socket.on('leave-obra', (obraId: string) => {
    socket.leave(`obra:${obraId}`);
  });
});

// Emit from anywhere after pin creation:
// io.to(`obra:${obraId}`).emit('new-pin', { pinId, obraId, authorName });
```

```typescript
// Source: Socket.io official Next.js guide (socket.io/how-to/use-with-nextjs)
// apps/web/providers/SocketProvider.tsx
"use client";
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({
  children,
  obraId,
}: {
  children: React.ReactNode;
  obraId: string;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_API_URL!, { withCredentials: true });
    s.emit('join-obra', obraId);
    setSocket(s);
    return () => { s.emit('leave-obra', obraId); s.disconnect(); };
  }, [obraId]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
```

---

### Pattern 4: R2 Presigned Upload for Large PDFs

**What:** Server action generates a presigned PUT URL. Browser uploads directly to R2. Server action is called again after upload completes to save the DB record and enqueue the BullMQ conversion job.

**When to use:** All PDF uploads (avoids proxying binary through Next.js API routes).

```typescript
// Source: Cloudflare R2 docs (developers.cloudflare.com/r2/api/s3/presigned-urls/)
// apps/web/lib/actions/plantas.ts
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUploadUrl(filename: string, contentType: string) {
  const key = `plantas/${Date.now()}-${filename}`;
  const url = await getSignedUrl(r2, new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 3600 });
  return { url, key };
}
```

---

### Pattern 5: BullMQ PDF Conversion Queue

```typescript
// Source: BullMQ docs (docs.bullmq.io/readme-1)
// apps/api/src/queues/pdf-conversion.queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export interface PdfConversionJobData {
  plantaRevisaoId: string;
  r2Key: string;         // source PDF key in R2
  obraId: string;
  pageCount?: number;
}

export const pdfConversionQueue = new Queue<PdfConversionJobData>('pdf-conversion', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
```

---

### Anti-Patterns to Avoid

- **Storing pixel coordinates in DB:** Pins stored as pixels break when user resizes window or changes zoom. Always normalize to 0.0–1.0.
- **Using fastify-socket.io npm package with Fastify 5:** Package is abandoned, has open peer dependency issue since Oct 2024. Use direct attachment to `fastify.server`.
- **Rendering 50MB PDF entirely in browser:** pdfjs-dist will OOM on large construction drawings. Apply the hybrid approach — render tiles for large files.
- **Blocking the API route with PDF conversion:** Enqueue conversion job and return immediately; client polls or receives socket event when tiles are ready.
- **Using `react-pdf-highlighter`:** Original package has no official React 19 support; community forks exist but are fragmented. Build the overlay with a plain `<div>` + `position: absolute` — it's simpler for the pin use case.
- **Setting workerSrc from CDN in production:** Use the local worker file from `pdfjs-dist` to avoid CDN dependency and version mismatch.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF rendering | Canvas renderer | react-pdf + pdfjs-dist | PDF spec is 750 pages; font handling, encoding, transparency alone cause months of edge cases |
| Image conversion | Custom WASM wrapper | @hyzyla/pdfium + sharp | PDFium WASM is production-ready, sharp handles all color space/ICC profile edge cases |
| Job queue with retries | setInterval polling | BullMQ + Redis | Retry logic, dead letter queues, delayed jobs, concurrency limiting, and BullBoard monitoring |
| WebSocket room management | Custom pub/sub | Socket.io rooms | Rooms handle fan-out, disconnection cleanup, and multi-instance scaling (with Redis adapter) |
| Presigned URL logic | Manual HMAC signing | @aws-sdk/s3-request-presigner | AWS signature v4 is subtle; wrong clock skew or missing headers cause silent failures |

**Key insight:** The PDF rendering pipeline is where most annotation tools fail — normalization of coordinates and handling PDFium's 0,0 = bottom-left coordinate origin are the two core gotchas that custom solutions get wrong.

---

## Common Pitfalls

### Pitfall 1: PDF.js Coordinate System Origin Mismatch

**What goes wrong:** PDF page origin is bottom-left (0,0) while canvas/screen origin is top-left. Click Y coordinates appear inverted or shifted.

**Why it happens:** PDF spec uses PostScript coordinates (Y increases upward); HTML/CSS uses screen coordinates (Y increases downward).

**How to avoid:** When using react-pdf's `<Page>` component, use the container div's `getBoundingClientRect()` for click coordinate capture — don't use PDF viewport's `convertToPdfPoint`. Store normalized CSS coordinates (top-left origin). Render pins as absolute positioned elements in the overlay div, not in PDF coordinate space.

**Warning signs:** Pins appear in the correct X position but wrong Y position; Y positions are mirrored.

---

### Pitfall 2: react-pdf v9 Worker ESM Path Issue in Next.js

**What goes wrong:** Build fails or viewer shows blank page with `Cannot resolve 'pdfjs-dist/build/pdf.worker.min.mjs'`.

**Why it happens:** react-pdf v9 switched to ESM; Next.js App Router bundling needs explicit `webpack` config to handle the worker file.

**How to avoid:**
```typescript
// apps/web/next.config.ts
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false; // pdfjs uses canvas in Node
    return config;
  },
};
```
And configure the worker in the component:
```typescript
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
```

**Warning signs:** Blank white PDF rendering area, console error about worker script.

---

### Pitfall 3: Socket.io Client Server-Side Rendering

**What goes wrong:** Next.js SSR tries to execute `io()` on the server, crashing with "window is not defined" or causing hydration mismatch.

**Why it happens:** `socket.io-client` uses browser APIs; RSC/SSR has no `window`.

**How to avoid:** Always initialize socket inside `useEffect` in a `"use client"` component. Never import socket at module level in RSC files. Use the SocketProvider pattern (Context + `useEffect`).

**Warning signs:** Hydration error "Text content does not match server-rendered HTML"; `window is not defined` in server logs.

---

### Pitfall 4: Pins Drift After Zoom

**What goes wrong:** Pins appear correctly at default zoom but shift position when user zooms in/out.

**Why it happens:** Pins are positioned using pixel values computed at render time, but container dimensions change with zoom.

**How to avoid:** Position pins using `left: ${pin.x * 100}%` and `top: ${pin.y * 100}%` CSS (percentage-based positioning in the overlay div). This always keeps pins proportional to the container regardless of zoom level.

**Warning signs:** Pins look correct initially, drift slightly with each zoom step.

---

### Pitfall 5: BullMQ Redis `maxRetriesPerRequest: null`

**What goes wrong:** BullMQ worker crashes on startup with "ERR max number of clients reached" or ECONNRESET under load.

**Why it happens:** IORedis's default `maxRetriesPerRequest` blocks commands; BullMQ needs `null` to use its own retry logic.

**How to avoid:** Always set `maxRetriesPerRequest: null` on the IORedis connection used for BullMQ (separate from application Redis connections).

**Warning signs:** Worker logs `ReplyError: ERR`; jobs stuck in `waiting` state.

---

### Pitfall 6: R2 Presigned URL CORS on Direct Browser Upload

**What goes wrong:** Browser upload to R2 presigned URL fails with CORS error even though the URL is valid.

**Why it happens:** R2 bucket CORS policy must explicitly allow the frontend origin for `PUT` requests; this is separate from application-level CORS.

**How to avoid:** Configure CORS on the R2 bucket via Cloudflare dashboard or Wrangler:
```json
[{
  "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
  "AllowedMethods": ["GET", "PUT"],
  "AllowedHeaders": ["Content-Type"],
  "MaxAgeSeconds": 3600
}]
```

**Warning signs:** Upload works from curl/Postman but fails in browser; Network tab shows 403 with no CORS headers in response.

---

## Code Examples

### react-pdf Basic Viewer Setup

```typescript
// Source: react-pdf GitHub README + Next.js issue #1855
// apps/web/app/(dashboard)/dashboard/obras/[id]/plantas/PlantaViewer.tsx
"use client";
import { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export function PlantaViewer({ pdfUrl, pins }: { pdfUrl: string; pins: Pin[] }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex-1 overflow-hidden bg-neutral-900">
      {/* Toolbar */}
      <ViewerToolbar
        pageNumber={pageNumber}
        numPages={numPages}
        scale={scale}
        onPageChange={setPageNumber}
        onScaleChange={setScale}
      />

      {/* PDF Canvas + Pin Overlay */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: 'fit-content' }}
        onClick={handleCanvasClick}
      >
        <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>

        {/* Absolute overlay for pins */}
        <PinLayer
          pins={pins.filter(p => p.pageNumber === pageNumber)}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}
```

### Prisma Schema — New Models

```prisma
// Source: Prisma soft delete docs + project schema patterns
// packages/db/prisma/schema.prisma (additions)

enum DisciplinaTipo {
  ARQUITETURA
  ESTRUTURAL
  ELETRICA
  HIDRAULICA
  INCENDIO
  TOPOGRAFIA
  CUSTOMIZADO
}

model Planta {
  id          String        @id @default(cuid())
  tenantId    String
  obraId      String
  obra        Obra          @relation(fields: [obraId], references: [id])
  nome        String
  disciplina  DisciplinaTipo
  disciplinaCustom String?   // populated when disciplina = CUSTOMIZADO
  revisoes    PlantaRevisao[]
  deletedAt   DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([obraId])
  @@index([tenantId])
}

model PlantaRevisao {
  id          String   @id @default(cuid())
  tenantId    String
  plantaId    String
  planta      Planta   @relation(fields: [plantaId], references: [id])
  revisao     String   // "R0", "R1", "R2", etc.
  changelog   String   // required — what changed
  r2Key       String   // original PDF key in R2
  tilesReady  Boolean  @default(false)
  tilesPrefix String?  // R2 prefix for WebP tiles, e.g. "tiles/plantaRevisaoId/"
  pageCount   Int?
  pins        Pin[]
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  uploadedBy  String   // User.id

  @@index([plantaId])
  @@index([tenantId])
}

model Pin {
  id              String        @id @default(cuid())
  tenantId        String
  plantaRevisaoId String
  plantaRevisao   PlantaRevisao @relation(fields: [plantaRevisaoId], references: [id])
  authorId        String
  x               Float         // normalized 0.0–1.0 (left–right)
  y               Float         // normalized 0.0–1.0 (top–bottom)
  pageNumber      Int
  thread          Thread?
  deletedAt       DateTime?
  createdAt       DateTime      @default(now())

  @@index([plantaRevisaoId])
  @@index([tenantId])
}

model Thread {
  id        String          @id @default(cuid())
  tenantId  String
  pinId     String          @unique
  pin       Pin             @relation(fields: [pinId], references: [id])
  messages  ThreadMessage[]
  deletedAt DateTime?
  createdAt DateTime        @default(now())
}

model ThreadMessage {
  id        String   @id @default(cuid())
  tenantId  String
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id])
  authorId  String
  content   String   @db.Text
  mentions  String[] // array of User.id mentioned with @
  deletedAt DateTime?
  createdAt DateTime @default(now())

  @@index([threadId])
}

model Notification {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String   // recipient
  type      String   // "new_pin" | "new_reply" | "new_revision" | "mention"
  payload   Json     // { pinId?, threadId?, obraId, authorName, ... }
  readAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([tenantId])
}
```

### BullMQ Worker — Full Pattern

```typescript
// Source: BullMQ docs + @hyzyla/pdfium render-pdf docs
// apps/api/src/queues/pdf-conversion.worker.ts
import { Worker } from 'bullmq';
import { PDFium } from '@hyzyla/pdfium';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@obravision/db';
import { connection, PdfConversionJobData } from './pdf-conversion.queue';
import { io } from '../app'; // exported Socket.io instance

const r2 = new S3Client({ /* R2 config */ });

export const pdfWorker = new Worker<PdfConversionJobData>(
  'pdf-conversion',
  async (job) => {
    const { plantaRevisaoId, r2Key, obraId } = job.data;

    // 1. Download PDF from R2
    const { Body } = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
    }));
    const pdfBuffer = Buffer.from(await Body!.transformToByteArray());

    // 2. Render each page to WebP with PDFium
    const pdfium = await PDFium();
    const document = await pdfium.loadDocument(pdfBuffer);
    const pages = [...document.pages()];

    const tilesPrefix = `tiles/${plantaRevisaoId}`;
    await Promise.all(pages.map(async (page, i) => {
      const { bitmap } = await page.render({ scale: 2 });
      const webpBuffer = await sharp(bitmap.data, {
        raw: { width: bitmap.width, height: bitmap.height, channels: 4 }
      }).webp({ quality: 85 }).toBuffer();

      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `${tilesPrefix}/page-${i + 1}.webp`,
        Body: webpBuffer,
        ContentType: 'image/webp',
      }));
    }));

    await document.destroy();

    // 3. Mark revision as tiles-ready in DB
    await prisma.plantaRevisao.update({
      where: { id: plantaRevisaoId },
      data: { tilesReady: true, tilesPrefix, pageCount: pages.length },
    });

    // 4. Notify obra room via Socket.io
    io.to(`obra:${obraId}`).emit('tiles-ready', { plantaRevisaoId });
  },
  { connection, concurrency: 2 }
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pdf.worker.js` | `pdf.worker.min.mjs` | pdfjs-dist v4 / react-pdf v9 | All worker path configs must use .mjs extension |
| fastify-socket.io npm | Direct attach to `fastify.server` | Fastify 5 release (Oct 2024) | fastify-socket.io is abandoned for Fastify 5 |
| react-pdf-highlighter | Custom SVG overlay | Package has no React 19 support | Build annotation layer yourself — it's ~50 lines |
| Prisma middleware for soft delete | Prisma Client Extensions | Prisma 5.x | Middleware deprecated; use `$extends` with model-level query overrides |

**Deprecated/outdated:**
- `fastify-socket.io` package: incompatible with Fastify 5, largely abandoned (Feb 2026)
- `react-pdf-highlighter`: no official React 19 support; community forks are fragmented — avoid
- `pdf.worker.min.js` (`.js` extension): replaced by `.mjs` in pdfjs-dist v4+

---

## Open Questions

1. **Redis availability in current infrastructure**
   - What we know: BullMQ and Socket.io Redis adapter both require Redis; project currently has no Redis
   - What's unclear: Whether to use Upstash (serverless Redis, HTTP-based) vs. a dedicated Redis instance (required for BullMQ which needs persistent TCP)
   - Recommendation: Use a dedicated Redis instance (Railway Redis or Render Redis); Upstash HTTP adapter is incompatible with BullMQ's blocking commands

2. **PDF tile serving — signed URLs vs public R2 bucket**
   - What we know: WebP tiles are stored in R2 under `tiles/` prefix; tiles need to be served to browser
   - What's unclear: Whether tiles should be served via public R2 URL (fast, but public) or via signed GET URL (secure, but adds latency and complexity)
   - Recommendation: Use a public R2 custom domain for the `tiles/` prefix only (separate from the private `plantas/` prefix for raw PDFs); mitigate with security-through-obscurity on tile keys

3. **Socket.io scaling beyond single process**
   - What we know: The Socket.io instance is in-process with Fastify; all events go through one node
   - What's unclear: Whether single-instance is acceptable for v1
   - Recommendation: Single instance is fine for v1. If scaling needed later, add `@socket.io/redis-adapter` with the same Redis instance.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (to be configured — none detected in project) |
| Config file | `vitest.config.ts` — Wave 0 |
| Quick run command | `pnpm --filter web vitest run --reporter=verbose` |
| Full suite command | `pnpm -r vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLNT-01 | Upload server action returns presigned URL with valid R2 key structure | unit | `pnpm --filter web vitest run tests/actions/plantas.test.ts` | ❌ Wave 0 |
| PLNT-02 | PlantaViewer renders <Document> with react-pdf, PinLayer renders normalized pins as % positions | unit | `pnpm --filter web vitest run tests/components/PlantaViewer.test.tsx` | ❌ Wave 0 |
| PLNT-03 | createRevision server action requires changelog; sets revisao to "R0"/"R1"/"R2" incrementally | unit | `pnpm --filter web vitest run tests/actions/revisoes.test.ts` | ❌ Wave 0 |
| PLNT-04 | clickToNormalized maps (0,0) to (0.0, 0.0) and container edge to (1.0, 1.0) | unit | `pnpm --filter web vitest run tests/lib/coordinates.test.ts` | ❌ Wave 0 |
| PLNT-05 | Socket.io server emits `new-pin` to `obra:{id}` room when pin is created | integration | `pnpm --filter api vitest run tests/socket/obra-room.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter web vitest run tests/lib/coordinates.test.ts`
- **Per wave merge:** `pnpm -r vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` — configure jsdom environment for component tests
- [ ] `apps/api/vitest.config.ts` — configure node environment for socket/queue tests
- [ ] `apps/web/tests/lib/coordinates.test.ts` — covers PLNT-04 (coordinate normalization pure function)
- [ ] `apps/web/tests/actions/plantas.test.ts` — covers PLNT-01 (mock R2 client)
- [ ] `apps/web/tests/actions/revisoes.test.ts` — covers PLNT-03 (mock Prisma)
- [ ] `apps/web/tests/components/PlantaViewer.test.tsx` — covers PLNT-02 (mock react-pdf)
- [ ] `apps/api/tests/socket/obra-room.test.ts` — covers PLNT-05 (in-memory socket.io server)
- [ ] Framework install: `pnpm add -D --filter web vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom` and `pnpm add -D --filter api vitest`

---

## Sources

### Primary (HIGH confidence)
- `@hyzyla/pdfium` npm registry — version 2.1.12, 42k weekly downloads, published ~11 days ago (Mar 2, 2026)
- `pdfium.js.org/docs/render-pdf` — rendering API, scale parameter (1=72dpi, 2=144dpi), bitmap output
- `docs.bullmq.io/readme-1` — Queue + Worker TypeScript pattern, `maxRetriesPerRequest: null` requirement
- `socket.io/how-to/use-with-nextjs` — Next.js App Router architecture, `useEffect` initialization, hydration warning
- `socket.io/docs/v4/server-initialization/` — server attachment patterns
- `developers.cloudflare.com/r2/api/s3/presigned-urls/` — R2 presigned PUT URL requirements
- `github.com/wojtekmaj/react-pdf/wiki/Upgrade-guide-from-version-8.x-to-9.x` — v9 ESM migration, `.mjs` worker

### Secondary (MEDIUM confidence)
- `github.com/ducktors/fastify-socket.io/issues/180` — confirmed abandoned for Fastify 5; custom plugin solution documented by community (Feb 2026)
- `prisma.io/docs/orm/prisma-client/client-extensions/middleware/soft-delete-middleware` — soft delete via Prisma Client Extensions
- Multiple WebSearch results cross-referenced for R2 multipart upload, BullMQ TypeScript setup

### Tertiary (LOW confidence)
- Tile serving via public R2 prefix vs signed URLs — no authoritative source found; recommendation is pragmatic

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry, official docs, or recent GitHub activity
- Architecture (normalized coords, hybrid rendering): HIGH — coordinate math is deterministic; rendering approach derived from library capabilities
- Socket.io/Fastify 5 integration: MEDIUM — workaround verified via GitHub issue analysis; pattern is proven but requires custom plugin code
- Pitfalls: HIGH — each pitfall sourced from official docs or confirmed GitHub issues
- Validation: MEDIUM — Vitest is the appropriate choice but not yet configured in the project

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (socket.io + fastify-socket.io ecosystem may evolve)
