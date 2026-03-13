# Phase 03: Cronograma + RDO - Research

**Researched:** 2026-03-13
**Domain:** Gantt chart (React), weather API integration (Open-Meteo), BullMQ cron jobs, RDO diary model with R2 photo upload, progress calculation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Gantt Interativo**
- Hierarquia de 2 niveis: Etapas (Fundacao, Alvenaria, Acabamento) > Tarefas. Etapas sao barras resumo no Gantt
- Interatividade: drag basico para mover datas das barras + formulario/modal para editar detalhes e dependencias
- Sem dependencias entre tarefas no v1 — tarefas sao independentes, sem setas de ligacao
- Status fixos padrao: Pendente, Em andamento, Concluida, Atrasada
- Permissoes: Admin + Engenheiro gerenciam cronograma, Cliente visualiza

**Diario de Obra (RDO)**
- Permissao: somente Engenheiro + Admin criam entradas no diario. Cliente visualiza
- Formato template adaptavel: texto livre + fotos como base, com campos opcionais expandiveis (mao de obra, materiais, ocorrencias). Usuario preenche so o que quiser
- Vinculo ao cronograma: sistema auto-detecta tarefa ativa baseado na data e status (Em andamento), campo pre-preenchido mas editavel pelo usuario
- Fotos com legenda: upload multiplo para R2, cada foto pode ter legenda/descricao opcional (ex: "Armacao do pilar 3")

**Alertas de Clima**
- Dupla antecedencia: alerta preliminar 3 dias antes ("possibilidade de chuva") + alerta confirmado 1 dia antes ("chuva confirmada")
- Marcacao de tarefas sensiveis: etapa define o default (ex: Fundacao = sensivel por default), cada tarefa pode sobrescrever individualmente via toggle
- Visual: icone de chuva aparece diretamente na barra da tarefa no Gantt + notificacao padrao (toast + badge + som do sistema existente Phase 2)
- Clima no RDO: sistema pre-preenche automaticamente o clima do dia (via API de clima), mas usuario pode corrigir manualmente se previsao estiver errada

**Progresso Real vs Planejado**
- Calculo automatico por dias trabalhados: conta quantos dias tem entrada de RDO vs duracao total planejada (ex: 3 dias de RDO em tarefa de 10 dias = 30%)
- Visualizacao no Gantt: barra dupla — barra escura = planejado, barra clara sobreposta = progresso real
- Widget no dashboard: curva S do progresso geral da obra (planejado vs real)
- Indicador de atraso: barra vermelha + badge com numero de dias de atraso (ex: "-3d"). Verde = no prazo, azul = adiantada

### Claude's Discretion
- Biblioteca/componente de Gantt chart (pesquisar opcoes React)
- API de clima (Open-Meteo ou similar — gratuita)
- Frequencia do cron job de clima (BullMQ ja existe)
- Layout exato do formulario de tarefa e do RDO
- Calculo exato da curva S no dashboard
- Design dos icones de clima no Gantt
- Logica de deteccao de "tarefa ativa" para pre-preenchimento do RDO

### Deferred Ideas (OUT OF SCOPE)
- Dependencias entre tarefas (FS/FF/SS/SF) — v2, quando validar que usuarios precisam
- Caminho critico no Gantt — v2, requer dependencias
- Exportar Gantt em PDF/Excel — v2 (Phase 5 relatorios)
- Status customizaveis de tarefa — v2, manter simples com fixos no v1
- 3 niveis de hierarquia (Etapas > Sub-etapas > Tarefas) — v2 se necessario
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRON-01 | User can create tasks with start/end date, responsavel, status, and parent stage | Prisma model (Etapa + Tarefa), Server Actions + Zod pattern established in Phase 1/2 |
| CRON-02 | User can view and edit interactive Gantt chart with task dependencies | @svar-ui/react-gantt v2.5 — MIT, React 19 compatible, drag-and-drop, TypeScript; "dependencies" in v1 means only parent Etapa grouping (no arrows) |
| CRON-03 | System alerts user when weather forecast predicts rain for climate-sensitive tasks | BullMQ upsertJobScheduler (cron), Open-Meteo free API (/v1/forecast), existing emitNotification + Socket.io channel |
| RDO-01 | User can create daily diary entry with text, photos, and weather of the day | Existing R2 presigned URL pipeline + getPresignedUploadUrl pattern; Open-Meteo same API for current-day weather; RDO Prisma model |
| RDO-02 | System auto-detects active task and pre-fills diary entry | Query Tarefa WHERE obraId = X AND status = "EM_ANDAMENTO" AND startDate <= today AND endDate >= today; if multiple, pick earliest startDate |
| RDO-03 | System calculates real progress vs planned by cross-referencing diary with schedule | COUNT(DISTINCT DATE(RDO.data)) / durationDays * 100; S-curve widget uses cumulative daily planned vs actual |
</phase_requirements>

---

## Summary

Phase 3 adds a Gantt-based schedule manager and field diary (RDO) to the obra detail page. The Gantt uses a 2-level hierarchy (Etapas as summary rows, Tarefas as leaf bars) with drag-to-reschedule and a dual-bar overlay showing planned vs actual progress. A BullMQ cron job polls Open-Meteo daily for each obra's coordinates and fires weather alerts via the existing notification channel for climate-sensitive tasks approaching rain dates. The RDO is a daily diary record with text, multi-photo upload to R2, auto-detected weather, and an auto-linked active task from the schedule — closing the loop between office planning and site execution.

All three sub-plans (03-01 Gantt model + chart, 03-02 weather cron, 03-03 RDO) follow the same established patterns: Server Actions + Zod + revalidatePath for mutations, Prisma + RLS for multi-tenancy, BullMQ for background jobs, R2 + presigned URLs for file storage, and Socket.io/emitNotification for real-time alerts. No new infrastructure is required — this phase is entirely additive on proven foundations.

The key new dependency is `@svar-ui/react-gantt` v2.5 (MIT, React 19 compatible) for the Gantt chart component. Open-Meteo is used for weather with no API key required.

**Primary recommendation:** Install @svar-ui/react-gantt, add BullMQ weather queue alongside the existing pdf-conversion queue pattern, and extend the Prisma schema with Etapa + Tarefa + RdoEntrada + RdoFoto models, all scoped by tenantId following established patterns.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @svar-ui/react-gantt | 2.5.x | Interactive Gantt chart component | MIT license, React 19 explicit support, drag-and-drop, TypeScript, handles 2-level hierarchy |
| bullmq | 5.71.0 (existing) | Weather cron job scheduler | Already in `apps/api`, same queue/worker pattern as pdf-conversion |
| ioredis | 5.10.0 (existing) | BullMQ connection | Already configured with maxRetriesPerRequest: null |
| Open-Meteo API | REST (no package) | Weather forecast | Free, no API key required, 16-day forecast, precipitation_probability field |
| @aws-sdk/client-s3 | 3.x (existing) | R2 photo upload for RDO | Same S3-compatible client used for plantas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | (existing via shadcn patterns) | S-curve progress widget | For the cumulative planned vs actual line chart in the dashboard widget |
| date-fns | (add) | Date arithmetic for progress calculation | Interval day counting, cron scheduling, date formatting for RDO |
| zod | 3.23.x (existing) | Form validation | All new server actions follow existing Zod schema pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @svar-ui/react-gantt | gantt-task-react | gantt-task-react last updated July 2022, not React 19 compatible — rejected |
| @svar-ui/react-gantt | dhtmlx-gantt React wrapper | Commercial license required for production — rejected |
| Open-Meteo | OpenWeatherMap | Requires API key, paid above free tier limits — rejected |
| BullMQ upsertJobScheduler | node-cron / setInterval | BullMQ already in stack, upsertJobScheduler is idempotent on restart — no new infra needed |

**Installation (new packages only):**
```bash
# In apps/web
pnpm --filter web add @svar-ui/react-gantt date-fns

# In apps/api (date-fns for date math in worker)
pnpm --filter api add date-fns
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
apps/web/
├── app/(dashboard)/dashboard/obras/[id]/
│   ├── cronograma/
│   │   └── page.tsx                    # Server component, loads Etapas+Tarefas
│   ├── rdo/
│   │   ├── page.tsx                    # RDO list (server component)
│   │   └── nova/page.tsx               # Create RDO entry
│   └── ObraDetailClient.tsx            # Add "Cronograma" + "RDO" tabs here
├── components/cronograma/
│   ├── GanttView.tsx                   # Client component wrapping @svar-ui/react-gantt
│   ├── EtapaForm.tsx                   # Create/edit Etapa modal
│   ├── TarefaForm.tsx                  # Create/edit Tarefa modal
│   └── ProgressWidget.tsx             # S-curve chart for dashboard
├── components/rdo/
│   ├── RdoForm.tsx                     # Diary entry form (adaptable template)
│   ├── RdoPhotoUpload.tsx              # Multi-photo upload with captions
│   └── RdoCard.tsx                    # Read view of an RDO entry
├── lib/actions/
│   ├── cronograma.ts                   # createEtapa, updateEtapa, createTarefa, updateTarefa, reorderTarefa
│   └── rdo.ts                         # createRdoEntrada, uploadRdoFoto, getActiveTask, getProgress

apps/api/src/queues/
├── weather-alert.queue.ts              # WeatherAlertJobData interface + Queue export
└── weather-alert.worker.ts            # Fetch Open-Meteo, compare to tasks, emit notifications

packages/db/prisma/
└── schema.prisma                       # Add: Etapa, Tarefa, RdoEntrada, RdoFoto models
```

### Pattern 1: 2-Level Gantt with @svar-ui/react-gantt

**What:** Etapas are rendered as summary "project" rows, Tarefas as child task bars. The component takes a flat array with `parent` field for grouping. Drag updates startDate/endDate in DB via server action.

**When to use:** The Gantt view tab of the obra detail page.

**Example:**
```typescript
// Source: https://svar.dev/react/gantt/ + @svar-ui/react-gantt docs
"use client"
import { Gantt } from "@svar-ui/react-gantt"

// Shape the Prisma data into Gantt tasks
const tasks = [
  // Etapa row (summary/parent)
  { id: etapa.id, text: etapa.nome, start: etapa.startDate, end: etapa.endDate, type: "summary" },
  // Tarefa rows
  ...etapa.tarefas.map(t => ({
    id: t.id,
    text: t.nome,
    start: t.startDate,
    end: t.endDate,
    parent: etapa.id,
    progress: t.progressoReal,  // 0–100
    // custom field to drive rain icon
    climaSensivel: t.climaSensivel,
    temAlertaChuva: t.temAlertaChuva,
  }))
]

// On drag end, call server action to persist new dates
function handleTaskUpdate(task) {
  updateTarefaDates({ id: task.id, startDate: task.start, endDate: task.end })
}

export function GanttView({ etapas }) {
  return (
    <Gantt
      tasks={tasks}
      onTaskUpdate={handleTaskUpdate}
      scales={[{ unit: "week", step: 1, format: "WW" }]}
    />
  )
}
```

### Pattern 2: BullMQ Weather Cron Job (upsertJobScheduler)

**What:** A single repeatable job that runs every morning, fetches Open-Meteo forecast for all obras with climate-sensitive tasks in the next 3 days, and fires notifications.

**When to use:** Registered once at Fastify app startup via upsertJobScheduler — safe to call on every restart due to upsert semantics.

**Example:**
```typescript
// Source: https://docs.bullmq.io/guide/job-schedulers
// apps/api/src/queues/weather-alert.queue.ts

import { Queue } from "bullmq"
import { connection } from "./pdf-conversion.queue" // reuse same Redis connection

export const weatherAlertQueue = new Queue("weather-alert", {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10000 } },
})

// Called at app startup (idempotent)
export async function registerWeatherAlertScheduler() {
  await weatherAlertQueue.upsertJobScheduler(
    "daily-weather-check",
    { pattern: "0 7 * * *" }, // every day at 07:00 (local server time)
    { name: "weather-check", data: {} }
  )
}
```

```typescript
// apps/api/src/queues/weather-alert.worker.ts

// Core logic inside the worker:
// 1. Get all active obras with lat/lon
// 2. Get all climate-sensitive tarefas with startDate in next 3 days
// 3. Fetch Open-Meteo /v1/forecast?latitude=X&longitude=Y&daily=precipitation_sum,precipitation_probability_max&forecast_days=3
// 4. For each tarefa whose date has precipitation_probability_max >= 50:
//    - 3 days out → type "weather_preliminary" notification
//    - 1 day out  → type "weather_confirmed" notification
// 5. emitNotification to admin+engenheiro members of that obra
```

### Pattern 3: Open-Meteo API Call

**What:** Free REST API — no API key, no registration. Returns daily aggregates including precipitation probability and precipitation sum.

**Example:**
```typescript
// Source: https://open-meteo.com/en/docs
// Request daily precipitation probability for next 3 days

const url = new URL("https://api.open-meteo.com/v1/forecast")
url.searchParams.set("latitude", String(obra.lat))
url.searchParams.set("longitude", String(obra.lon))
url.searchParams.set("daily", "precipitation_probability_max,precipitation_sum")
url.searchParams.set("forecast_days", "3")
url.searchParams.set("timezone", "America/Sao_Paulo")  // Brasil

const res = await fetch(url.toString())
const data = await res.json()
// data.daily.time: ["2026-03-14", "2026-03-15", "2026-03-16"]
// data.daily.precipitation_probability_max: [80, 20, 60]
// data.daily.precipitation_sum: [12.3, 0.0, 5.1]
```

### Pattern 4: RDO Active Task Auto-Detection

**What:** On RDO entry creation, query for the task in "Em andamento" status whose date range covers today. Pre-fill in the form but leave editable.

**Example:**
```typescript
// lib/actions/rdo.ts
export async function getActiveTask(obraId: string, date: Date) {
  const { empresa } = await getTenantContext()
  const tc = createTenantClient(empresa.tenantId)

  return tc.tarefa.findFirst({
    where: {
      obraId,
      status: "EM_ANDAMENTO",
      startDate: { lte: date },
      endDate:   { gte: date },
    },
    orderBy: { startDate: "asc" }, // if multiple, pick earliest
    include: { etapa: true },
  })
}
```

### Pattern 5: Progress Calculation (RDO Days vs Planned Duration)

**What:** For each tarefa, real progress = (count of distinct RDO entry dates within task period) / (total planned duration in days) * 100.

**Example:**
```typescript
// packages/db approach — computable in Prisma or in-memory
async function calcProgressoReal(tarefaId: string, tc: PrismaClient) {
  const tarefa = await tc.tarefa.findUniqueOrThrow({
    where: { id: tarefaId },
    include: { rdoEntradas: { select: { data: true } } }
  })

  const plannedDays = differenceInDays(tarefa.endDate, tarefa.startDate) + 1

  // Count distinct calendar days with RDO entries within the task period
  const rdoDays = new Set(
    tarefa.rdoEntradas
      .filter(r => r.data >= tarefa.startDate && r.data <= tarefa.endDate)
      .map(r => r.data.toISOString().slice(0, 10))
  ).size

  return Math.min(100, Math.round((rdoDays / plannedDays) * 100))
}
```

### Anti-Patterns to Avoid

- **Storing lat/lon on Obra:** The obra model currently has only address fields (logradouro, cidade, estado, cep). Geocoding from address is needed — either geocode at task creation time (store lat/lon on Obra) or in the weather worker. Store on Obra via migration (lat Float?, lon Float?) and populate via a free geocoding call (e.g., Nominatim/OpenStreetMap) when an Obra is saved. Do NOT geocode on every weather job run.
- **Calling Open-Meteo per-tarefa:** Group by obra — one API call per obra, then check all obra's tasks against the result.
- **Registering upsertJobScheduler inside route handlers:** Call it once at Fastify startup (app.ts), not on every request.
- **Using gantt-task-react:** Package is 4 years unmaintained and not React 19 compatible. Use @svar-ui/react-gantt.
- **Embedding photos in JSON payload:** Store RdoFoto as separate DB rows with R2 key + caption. Do not blob-encode photos into JSON columns.
- **Missing tenantId on new Prisma models:** Every new model (Etapa, Tarefa, RdoEntrada, RdoFoto) must have `tenantId String` with an `@@index([tenantId])`. Follow the same RLS pattern as existing tables.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gantt rendering with drag-drop | Custom SVG/canvas Gantt | @svar-ui/react-gantt | Date math, drag heuristics, resize handles, touch support are all solved |
| Cron scheduling | setInterval, node-cron | BullMQ upsertJobScheduler | Already in stack, survives restarts, has retry/backoff, Redis-backed |
| Weather forecast | Custom scraping | Open-Meteo REST API | Free, 16-day forecast, no auth, daily precipitation_probability_max field |
| Progress % formula | Complex earned-value | Simple RDO-days / planned-days | Matches the user decision exactly; EVMS is deferred |
| Multi-photo upload | Streaming server upload | Presigned PUT URLs (existing R2 pattern) | Browser-direct upload, zero API server bandwidth, already in planta.ts |

**Key insight:** The pdf-conversion queue pattern in `apps/api/src/queues/` is the exact template for the weather-alert queue. Copy the structure, change the job data shape and worker logic.

---

## Common Pitfalls

### Pitfall 1: Obra has no lat/lon — Weather API needs coordinates
**What goes wrong:** Open-Meteo requires latitude/longitude. The Obra model currently only stores address strings (logradouro, cidade, estado, cep, CEP).
**Why it happens:** Phase 1 did not need geolocation.
**How to avoid:** Add `lat Float?` and `lon Float?` columns to the Obra model in the schema migration. Geocode on Obra create/update using a free geocoder (Nominatim via `https://nominatim.openstreetmap.org/search?q=...&format=json`). The weather worker skips obras where lat/lon is null.
**Warning signs:** Worker crashes with "latitude is required" on first run.

### Pitfall 2: @svar-ui/react-gantt requires "use client" and cannot be in a Server Component
**What goes wrong:** The Gantt component uses React state, refs, and browser DOM APIs — it will throw during SSR if rendered in a Server Component.
**Why it happens:** Next.js 15 renders Server Components on the server by default.
**How to avoid:** Always wrap GanttView in a Client Component (`"use client"`) and pass pre-fetched data as props from the Server Component page. Use `dynamic(() => import('../GanttView'), { ssr: false })` if needed to avoid hydration mismatches.

### Pitfall 3: BullMQ upsertJobScheduler called at wrong level
**What goes wrong:** If upsertJobScheduler is called inside a Fastify route handler, it runs on every request — creating or updating the scheduler repeatedly.
**Why it happens:** Confusing "register on startup" with "register on request".
**How to avoid:** Call `registerWeatherAlertScheduler()` in `app.ts` after the queues are initialized, same location where pdfWorker is started. One call, once, at boot.

### Pitfall 4: Gantt task dates stored as JS Date vs ISO strings
**What goes wrong:** @svar-ui/react-gantt expects `start` and `end` as JavaScript `Date` objects, but Prisma returns DateTime fields as JS Date. No conversion needed — but serialization through `JSON.stringify` (e.g., in Server Action responses) will lose the Date type.
**Why it happens:** Next.js Server Actions serialize return values to JSON. Dates become ISO strings in the client.
**How to avoid:** Either (a) pass the raw Prisma data as props from Server Component to Client Component (no serialization), or (b) convert ISO strings back to `new Date()` in the client component before passing to Gantt.

### Pitfall 5: Multiple active tasks per day — RDO auto-detection ambiguity
**What goes wrong:** If multiple tarefas have status "Em andamento" and their date ranges overlap today, the auto-detection query returns more than one result.
**Why it happens:** Realistic scenario — two tasks running in parallel.
**How to avoid:** Use `findFirst` with `orderBy: { startDate: 'asc' }` to pick deterministically. The field is editable by the user anyway — auto-detection is a convenience, not authoritative.

### Pitfall 6: Weather cron fires before obra has any climate-sensitive tasks
**What goes wrong:** Worker fetches weather but no tasks are marked climate-sensitive, resulting in wasted API calls and misleading behavior.
**How to avoid:** In the worker, skip API call if `await tc.tarefa.count({ where: { obraId, climaSensivel: true, startDate: { gte: today, lte: threeDaysFromNow } } }) === 0`.

### Pitfall 7: R2 key collisions for RDO photos
**What goes wrong:** Two concurrent uploads with the same filename generate the same R2 key if timestamp resolution is millisecond-level.
**How to avoid:** Follow existing planta.ts convention: `rdo/{tenantId}/{rdoEntradaId}/{nanoid()}-{filename}`. Include `rdoEntradaId` and a `nanoid()` for uniqueness.

---

## Code Examples

Verified patterns from existing codebase and official sources:

### Presigned PUT URL for RDO Photos (follows planta.ts pattern)
```typescript
// Source: apps/web/lib/actions/planta.ts (getPresignedUploadUrl)
// Pattern to reuse for RDO photos:

export async function getRdoPhotoUploadUrl(
  rdoEntradaId: string,
  filename: string,
  contentType: string
) {
  const { empresa } = await getTenantContext()
  const r2 = getR2Client()
  const key = `rdo/${empresa.tenantId}/${rdoEntradaId}/${nanoid()}-${filename}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 } // 5 minutes
  )

  return { url, key }
}
```

### emitNotification for Weather Alert (follows notification.ts pattern)
```typescript
// Source: apps/web/lib/actions/notification.ts (emitNotification)
// In weather-alert.worker.ts — call the Fastify /api/notifications/emit endpoint directly
// (worker runs in API process, can call prisma + fetch directly)

await prisma.notification.createMany({
  data: recipientIds.map(userId => ({
    userId,
    tenantId: obra.tenantId,
    type: alertType, // "weather_preliminary" | "weather_confirmed"
    payload: {
      obraId: obra.id,
      obraName: obra.nome,
      tarefaId: tarefa.id,
      tarefaNome: tarefa.nome,
      alertDate: targetDate.toISOString(),
      precipitationProbability: prob,
    },
  }))
})

// Then emit via Socket.io (worker has access to io instance via setSocketIo pattern)
if (ioInstance) {
  ioInstance.to(`obra:${obra.id}`).emit("weather-alert", {
    type: alertType,
    tarefaId: tarefa.id,
  })
}
```

### Proposed Prisma Schema Additions
```prisma
// packages/db/prisma/schema.prisma — additions for Phase 3

enum TarefaStatus {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDA
  ATRASADA
}

model Etapa {
  id             String    @id @default(cuid())
  tenantId       String
  obraId         String
  obra           Obra      @relation(fields: [obraId], references: [id])
  nome           String    // "Fundacao", "Alvenaria", etc.
  ordem          Int       // display order in Gantt
  climaSensivel  Boolean   @default(false) // default for child tasks
  tarefas        Tarefa[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([obraId])
  @@index([tenantId])
}

model Tarefa {
  id             String       @id @default(cuid())
  tenantId       String
  obraId         String
  etapaId        String
  etapa          Etapa        @relation(fields: [etapaId], references: [id])
  nome           String
  responsavelId  String?      // User.id
  status         TarefaStatus @default(PENDENTE)
  startDate      DateTime
  endDate        DateTime
  climaSensivel  Boolean?     // null = inherit from Etapa; true/false = override
  progressoReal  Int          @default(0) // 0-100, computed from RDO entries
  rdoEntradas    RdoEntrada[] // for progress calculation
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([obraId])
  @@index([etapaId])
  @@index([tenantId])
}

model RdoEntrada {
  id             String     @id @default(cuid())
  tenantId       String
  obraId         String
  obra           Obra       @relation(fields: [obraId], references: [id])
  tarefaId       String?    // auto-detected active task, editable
  tarefa         Tarefa?    @relation(fields: [tarefaId], references: [id])
  autorId        String     // User.id (ADMIN or ENGENHEIRO only)
  data           DateTime   // the diary date (usually today)
  texto          String?    @db.Text  // free text
  // Optional expandable fields
  maoDeObra      Json?      // { count: Int, notes: String }
  materiais      Json?      // free-form list
  ocorrencias    String?    @db.Text
  // Auto-detected weather (pre-filled, user-editable)
  climaCondicao  String?    // "Ensolarado", "Nublado", "Chuva", etc.
  climaTemp      Float?     // °C
  climaUmidade   Float?     // %
  climaFonteDado String?    // "open-meteo" | "manual"
  fotos          RdoFoto[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@unique([obraId, data])  // one diary entry per obra per day
  @@index([obraId])
  @@index([tarefaId])
  @@index([tenantId])
}

model RdoFoto {
  id          String     @id @default(cuid())
  tenantId    String
  rdoEntradaId String
  rdoEntrada  RdoEntrada @relation(fields: [rdoEntradaId], references: [id])
  r2Key       String
  legenda     String?
  ordem       Int        @default(0)
  createdAt   DateTime   @default(now())

  @@index([rdoEntradaId])
  @@index([tenantId])
}
```

### S-Curve Widget (cumulative progress)
```typescript
// The S-curve chart: for each day from obra.startDate to today,
// compute cumulativePlanned (sum of tarefa-days due) and cumulativeActual (sum of RDO entry days)

// Planned: a tarefa contributes (1/durationDays * 100) points per calendar day in its range
// Actual: a tarefa contributes (1/durationDays * 100) points per day that has an RDO entry

// Output shape for recharts:
// [{ date: "2026-03-01", planned: 10, actual: 8 }, ...]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| gantt-task-react | @svar-ui/react-gantt | 2024-2025 | gantt-task-react unmaintained; SVAR v2.3+ explicitly targets React 19 |
| BullMQ Queue.add with repeat option | BullMQ upsertJobScheduler | BullMQ v5.16.0 | Old repeat API deprecated; upsertJobScheduler is idempotent on restart |
| Custom cron (node-cron) | BullMQ job scheduler | — | No new cron infra needed — BullMQ already handles scheduling |

**Deprecated/outdated:**
- `queue.add({ repeat: { cron: "..." } })`: Replaced by `queue.upsertJobScheduler()` in BullMQ v5.16+. The project runs BullMQ 5.71 so use the new API.
- `gantt-task-react`: Last published July 2022 — do not use.

---

## Open Questions

1. **Obra lat/lon geocoding strategy**
   - What we know: Open-Meteo requires latitude/longitude; Obra has address strings only
   - What's unclear: Should geocoding happen synchronously on Obra save, or lazily in the weather worker? Nominatim has a 1 req/sec rate limit with required User-Agent header.
   - Recommendation: Geocode once when Obra is created/address edited, store on the Obra row. Use `https://nominatim.openstreetmap.org/search` with proper `User-Agent` header. Store null lat/lon is fine — weather worker skips obras with null coords.

2. **@svar-ui/react-gantt dual-bar progress rendering**
   - What we know: The library has a `progress` field (0–100) that renders a lighter fill overlay on the task bar
   - What's unclear: Whether the "planned vs actual" dual-bar design (dark = planned full bar, lighter = actual progress) is achievable via the built-in `progress` field or requires custom task rendering
   - Recommendation: Use the library's `progress` field for real progress (renders as lighter fill). The "planned" bar is just the full task bar width. This natively achieves the dual-bar look described in CONTEXT.md without custom rendering.

3. **RDO `@@unique([obraId, data])` constraint vs multiple obras in same empresa**
   - What we know: The constraint prevents two diary entries for the same obra on the same day (sensible business rule — one diary per obra per day)
   - What's unclear: Should the unique be on `(obraId, data)` or `(obraId, data, autorId)` (allowing multiple engineers to file separate diaries)?
   - Recommendation: `(obraId, data)` — one official diary per obra per day. Multiple engineers can co-edit the same entry. If conflicting input is needed later, add `autorId` to the unique key.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.x |
| Config file | `apps/web/vitest.config.ts` (exists) |
| Quick run command | `pnpm --filter web test` |
| Full suite command | `pnpm --filter web test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRON-01 | createTarefa action: creates tarefa with required fields, enforces ADMIN/ENGENHEIRO role | unit | `pnpm --filter web test -- tests/actions/cronograma.test.ts` | Wave 0 |
| CRON-01 | createEtapa action: creates etapa under obra, returns etapa with tarefas | unit | `pnpm --filter web test -- tests/actions/cronograma.test.ts` | Wave 0 |
| CRON-02 | updateTarefaDates action: updates startDate/endDate, rejects CLIENTE role | unit | `pnpm --filter web test -- tests/actions/cronograma.test.ts` | Wave 0 |
| CRON-02 | GanttView component: renders task bars (smoke test) | unit | `pnpm --filter web test -- tests/components/GanttView.test.tsx` | Wave 0 |
| CRON-03 | weather worker: detects tasks with rain probability >= 50%, fires correct notification type | unit | `pnpm --filter api test -- tests/workers/weather-alert.test.ts` | Wave 0 |
| RDO-01 | createRdoEntrada action: persists texto, clima, tarefaId | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | Wave 0 |
| RDO-01 | getRdoPhotoUploadUrl: returns url + key starting with 'rdo/' | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | Wave 0 |
| RDO-02 | getActiveTask: returns EM_ANDAMENTO tarefa covering today; returns null if none | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | Wave 0 |
| RDO-03 | calcProgressoReal: 3 RDO entries in 10-day task = 30% | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | Wave 0 |
| RDO-03 | S-curve data: cumulative planned/actual arrays have correct length and values | unit | `pnpm --filter web test -- tests/actions/rdo.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter web test`
- **Per wave merge:** `pnpm --filter web test && pnpm --filter api test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/web/tests/actions/cronograma.test.ts` — covers CRON-01, CRON-02
- [ ] `apps/web/tests/components/GanttView.test.tsx` — smoke test for CRON-02
- [ ] `apps/web/tests/actions/rdo.test.ts` — covers RDO-01, RDO-02, RDO-03
- [ ] `apps/api/tests/workers/weather-alert.test.ts` — covers CRON-03
- [ ] `apps/api/vitest.config.ts` — API vitest config (verify exists; api package.json has vitest but no config file found)

---

## Sources

### Primary (HIGH confidence)
- `apps/api/src/queues/pdf-conversion.queue.ts` — BullMQ Queue + IORedis connection pattern (existing codebase)
- `apps/api/src/queues/pdf-conversion.worker.ts` — Worker pattern, R2 access, Socket.io emit (existing codebase)
- `apps/web/lib/actions/notification.ts` — emitNotification, getTenantContext, getObraMemberIds patterns
- `apps/web/lib/actions/planta.ts` — presigned URL generation pattern (getPresignedUploadUrl)
- `packages/db/prisma/schema.prisma` — existing model structure and tenantId RLS pattern
- https://docs.bullmq.io/guide/job-schedulers — upsertJobScheduler API, cron scheduling
- https://open-meteo.com/en/docs — forecast endpoint, precipitation_probability_max, daily parameters
- https://svar.dev/react/gantt/ — @svar-ui/react-gantt v2.5, MIT license, React 19 support, drag-and-drop

### Secondary (MEDIUM confidence)
- https://dev.to/olga_tash/svar-react-gantt-v23-modern-project-timelines-for-react-19-e7f — React 19 compatibility confirmed for SVAR v2.3+
- https://github.com/MaTeMaTuK/gantt-task-react — confirmed unmaintained (last update July 2022)

### Tertiary (LOW confidence)
- Nominatim geocoding for lat/lon — usage pattern based on public documentation, rate limits may vary; validate before implementing

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @svar-ui/react-gantt React 19 support verified from official blog post and GitHub; BullMQ version and upsertJobScheduler API verified from official docs; Open-Meteo endpoint verified from official docs
- Architecture: HIGH — All patterns (Server Actions, BullMQ workers, R2, emitNotification) are from existing working code in this repo
- Pitfalls: HIGH — Geocoding gap is a real structural issue identified by examining the schema; Gantt SSR pitfall is standard Next.js behavior; BullMQ upsertJobScheduler vs deprecated API is from official docs

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable libraries — @svar-ui/react-gantt has active development so verify version before install)
