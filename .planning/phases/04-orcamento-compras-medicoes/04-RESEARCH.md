# Phase 4: Orcamento + Compras + Medicoes - Research

**Researched:** 2026-03-14
**Domain:** Financial operations for Brazilian civil construction — budgeting (SINAPI/BDI), procurement workflow, inventory control, and progress measurements
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Estrutura do Orcamento:**
- Entrada de dados: manual (busca SINAPI + adiciona itens) E importacao de planilha Excel/CSV
- Hierarquia de 2 niveis: Etapa (Fundacao, Alvenaria...) > Item de orcamento
- BDI global por obra — um percentual unico aplicado sobre o custo total
- Duas visoes: Custo (quanto custa construir) e Venda (com BDI aplicado, quanto cobrar do cliente)
- Curva ABC de insumos e proposta comercial exportavel (Plan 04-02 no roadmap)

**Fluxo de Compras:**
- Workflow de 3 etapas: Requisicao > Cotacao > Pedido de Compra
- Fornecedores cadastrados por empresa (nao por obra) — reutilizaveis entre obras. Dados: nome, CNPJ, contato, categorias
- Aprovacao: Admin E Engenheiro podem aprovar requisicoes
- Mapa comparativo: tabela lado a lado (itens nas linhas, fornecedores nas colunas, destaque no menor preco por item)
- Requisicao vinculada ao item do orcamento — sistema sabe quanto ja foi comprado vs orcado
- Notificacoes de aprovacao via sistema in-app existente (toast + badge + sino)
- Pedido de compra gera PDF exportavel para enviar ao fornecedor
- Ao marcar pedido como "Entregue", sistema cria entrada automatica no estoque

**Controle de Estoque:**
- Multiplos depositos por obra (almoxarifado central, canteiro, deposito externo)
- 3 tipos de movimentacao: Entrada (compra/devolucao), Saida (uso na obra/perda), Transferencia (entre depositos)
- Alerta de estoque baixo com minimo configuravel por material — notificacao in-app quando cai abaixo
- Saida de material com campo opcional de tarefa/etapa destino — permite rastrear custo por atividade
- Permissoes: Admin + Engenheiro gerenciam estoque, Cliente visualiza

**Medicoes Fisicas e de Contrato:**
- Medicao fisica: percentual executado por item do orcamento (ex: Fundacao 80%). Sistema calcula progresso geral ponderado pelo valor. Cada registro e um boletim de medicao
- Medicao contratual: boletim por empreiteiro com contrato (itens + valores). Engenheiro registra quanto foi executado por periodo, historico acumulado
- Aprovacao: Admin aprova medicoes antes de gerar pagamento (mesmo fluxo de aprovacao das compras)
- PDF exportavel do boletim de medicao (itens, quantidades, valores acumulados)

### Claude's Discretion
- Estrutura exata do banco SINAPI (como indexar/buscar codigos eficientemente)
- Parser de planilha Excel/CSV para importacao de orcamento
- Layout exato de todos os formularios e tabelas
- Design do mapa comparativo de cotacoes
- Gerador de PDF para pedido de compra e boletim de medicao (server-side rendering)
- Calculo de progresso ponderado por valor
- Algoritmo de alerta de estoque baixo
- Loading states, skeletons, error handling
- Estrategia de cache para dados financeiros

### Deferred Ideas (OUT OF SCOPE)
- Integracao com ERP externo (Sienge, UAU) — v2
- Nota fiscal eletronica (NF-e) vinculada ao pedido de compra — v2
- App mobile para conferencia de estoque em campo — v2
- Fluxo de devolucao para fornecedor — v2
- Multiplas moedas / cotacao em dolar — v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ORC-01 | Busca de codigos SINAPI por descricao e adicao ao orcamento | SINAPI data seeded as PostgreSQL table; full-text search via `tsvector` + GIN index |
| ORC-02 | Hierarquia Etapa > Item com quantidades, unidades e custo unitario | Schema: `OrcamentoEtapa` > `OrcamentoItem`; Decimal precision for financial values |
| ORC-03 | BDI global por obra aplicado ao custo total; visoes Custo e Venda | BDI stored as `Decimal(5,2)` on `Orcamento`; view calculated at query/render time |
| ORC-04 | Importacao de planilha Excel/CSV para orcamento | SheetJS from CDN (`xlsx@0.20.3`); parsed in server action; column mapping to schema |
| ORC-05 | Curva ABC de insumos (ordenacao por valor descendente, acumulado %) | Pure SQL: `ORDER BY valor_total DESC`, running SUM / grand total * 100 |
| ORC-06 | Proposta comercial exportavel em PDF | `@react-pdf/renderer` v4 in BullMQ worker; stored in R2; presigned download URL |
| COMP-01 | Requisicao de compra vinculada ao item do orcamento | `CompraRequisicao` FK to `OrcamentoItem`; aggregation shows comprado vs orcado |
| COMP-02 | Fluxo de aprovacao de requisicao (ADMIN ou ENGENHEIRO) | Status enum `PENDENTE > APROVADA > COTACAO > PEDIDO`; server action checks role |
| COMP-03 | Cotacao de fornecedores com mapa comparativo lado a lado | `CompraCotacao` per supplier per requisicao; server-rendered comparison table |
| COMP-04 | Pedido de compra com PDF exportavel para enviar ao fornecedor | Same PDF worker pattern as ORC-06; `CompraPedido` status lifecycle |
| COMP-05 | Ao receber pedido, entrada automatica no estoque | `onDeliverPedido` server action creates `MovimentacaoEstoque` with `tipo=ENTRADA` |
| COMP-06 | Fornecedores por empresa (reutilizaveis entre obras) | `Fornecedor` model with `empresaId` FK; no `obraId` — shared across obras |
| MED-01 | Medicao fisica: percentual por item do orcamento, progresso ponderado | `MedicaoFisica` with `percentualExecutado` per item; weighted avg by `valorTotal` |
| MED-02 | Medicao contratual: boletim por empreiteiro, historico acumulado | `MedicaoContrato` + `MedicaoContratoItem`; cumulative sum query; PDF export |
</phase_requirements>

---

## Summary

Phase 4 adds the financial operations layer to ProjetaPro: budget building with SINAPI codes and BDI, a 3-step procurement workflow, multi-depot inventory control, and two types of progress measurements. All five plans build on established Phase 1-3 patterns (Server Actions + Zod + RLS + BullMQ + Socket.io + R2) without introducing fundamentally new infrastructure.

The main technical novelties are: (1) seeding SINAPI data into PostgreSQL with a full-text search index for the budget builder; (2) installing SheetJS from the CDN (not npm) for Excel import; (3) adding `@react-pdf/renderer` v4 to the API worker for document generation; and (4) implementing running-total SQL for Curva ABC and weighted-average progress for medicoes. Every other capability is an extension of existing patterns.

**Primary recommendation:** Seed SINAPI composicoes from the monthly CAIXA Excel using SheetJS in a one-time script, index with PostgreSQL `tsvector` + GIN, and reuse BullMQ + R2 for all PDF generation. No new infrastructure required.

---

## Standard Stack

### Core (already in project — zero new installs for most plans)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.3.8 | App Router, Server Actions, RSC | Already installed |
| Prisma | current | ORM for all new models | Already installed |
| PostgreSQL | Railway managed | tsvector full-text search for SINAPI | Already installed |
| Zod | ^3.23.8 | Schema validation in server actions | Already installed |
| shadcn/ui | current | Button, Card, Input, Table, Badge | Already installed |
| Tailwind CSS | ^3.4.14 | Styling | Already installed |
| BullMQ | ^5.71.0 | PDF generation background jobs | Already installed in API |
| Socket.io | ^4.8.3 | Real-time approval notifications | Already installed |
| @aws-sdk/client-s3 | ^3.1009.0 | R2 upload/download for PDFs | Already installed |
| sonner | ^2.0.7 | Toast notifications | Already installed |
| date-fns | ^4.1.0 | Date formatting in PDFs and views | Already installed |

### New Installs Required

| Library | Version | Purpose | Install Location |
|---------|---------|---------|-----------------|
| xlsx (SheetJS) | 0.20.3 from CDN | Parse Excel/CSV for budget import | `apps/web` (server action) |
| @react-pdf/renderer | ^4.3.2 | Generate PDFs in BullMQ worker | `apps/api` |

**Installation:**
```bash
# In apps/web — install SheetJS from CDN (NOT npm registry, which has outdated 0.18.5 with CVEs)
pnpm --filter web add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

# In apps/api — PDF renderer for BullMQ workers
pnpm --filter api add @react-pdf/renderer
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| xlsx (SheetJS) | papaparse (CSV only) | SheetJS handles both XLSX and CSV; papaparse is CSV-only |
| @react-pdf/renderer | Puppeteer | Puppeteer needs headless Chrome binary — too heavy for Railway worker; react-pdf is pure Node.js with familiar JSX syntax |
| PostgreSQL tsvector | pg_trgm / ILIKE | tsvector + GIN is faster for large datasets (50k+ SINAPI rows); ILIKE acceptable for < 5k rows |

---

## Architecture Patterns

### Recommended Project Structure (new files for Phase 4)

```
apps/web/
├── app/(dashboard)/dashboard/obras/[id]/
│   ├── orcamento/          # Plan 04-01, 04-02: budget tabs
│   ├── compras/            # Plan 04-03: procurement workflow
│   ├── estoque/            # Plan 04-04: inventory
│   └── medicoes/           # Plan 04-05: measurements
├── components/
│   ├── orcamento/          # OrcamentoTable, BdiConfig, SinapiSearch, ImportModal
│   ├── compras/            # RequisicaoForm, MapaComparativo, PedidoCard
│   ├── estoque/            # DepositoSelector, MovimentacaoForm, EstoqueTable
│   └── medicoes/           # MedicaoFisicaForm, MedicaoContratoForm, BulletimCard
├── lib/
│   ├── actions/
│   │   ├── orcamento.ts    # createOrcamento, addItem, updateBdi, importFromSheet
│   │   ├── compras.ts      # createRequisicao, approveRequisicao, addCotacao, createPedido, deliverPedido
│   │   ├── estoque.ts      # createDeposito, addMovimentacao, getEstoqueAtual
│   │   └── medicoes.ts     # createMedicaoFisica, createMedicaoContrato, approveMedicao
│   └── validations/
│       ├── orcamento.ts
│       ├── compras.ts
│       └── medicoes.ts

apps/api/src/
├── queues/
│   ├── pdf-generation.queue.ts    # new — shared queue for all PDF types
│   └── pdf-generation.worker.ts   # new — renders react-pdf templates
└── pdf-templates/
    ├── PedidoCompra.tsx            # PDF template for purchase order
    ├── BoletimMedicao.tsx          # PDF template for measurement report
    └── PropostaComercial.tsx       # PDF template for commercial proposal

packages/db/prisma/
└── schema.prisma   # add Phase 4 models (see below)
```

### Pattern 1: SINAPI Seed + Full-Text Search

**What:** SINAPI data (50k+ composicoes) seeded once from CAIXA monthly Excel via a script, stored as a read-only PostgreSQL table with a generated `tsvector` column and GIN index.

**When to use:** Every call to the budget builder's SINAPI search input.

**Schema:**
```prisma
model SinapiComposicao {
  id          String  @id @default(cuid())
  codigo      String  @unique  // e.g. "74209/001"
  descricao   String  @db.Text
  unidade     String  // "m2", "m3", "un", "h", etc.
  custoUnitario Decimal @db.Decimal(12, 4)
  estado      String  @db.Char(2)  // "SP", "RJ" — SINAPI is state-specific
  referencia  String  // "01/2026" — month/year of the table
  searchVec   Unsupported("tsvector")?

  @@index([estado, referencia])
}
```

**Migration (one-time after schema):**
```sql
-- After prisma migrate
ALTER TABLE "SinapiComposicao"
  ADD COLUMN "searchVec" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce("descricao", '') || ' ' || coalesce("codigo", ''))
  ) STORED;

CREATE INDEX "SinapiComposicao_searchVec_idx" ON "SinapiComposicao" USING GIN ("searchVec");
```

**Search query (raw Prisma):**
```typescript
// Source: PostgreSQL docs — https://www.postgresql.org/docs/current/textsearch-tables.html
const results = await prisma.$queryRaw`
  SELECT id, codigo, descricao, unidade, "custoUnitario"
  FROM "SinapiComposicao"
  WHERE "searchVec" @@ plainto_tsquery('portuguese', ${query})
    AND estado = ${estado}
    AND referencia = ${referencia}
  ORDER BY ts_rank("searchVec", plainto_tsquery('portuguese', ${query})) DESC
  LIMIT 20
`
```

### Pattern 2: BDI Calculation (Custo vs Venda View)

**What:** BDI stored as a single `Decimal(5,2)` on `Orcamento`. Custo view shows raw `custoTotal`. Venda view computes `custoTotal * (1 + bdi/100)` in the query or at render time.

**When to use:** Any read of orcamento values — always derive venda from custo + BDI, never store venda separately.

**Example:**
```typescript
// Source: Confirmed by domain research (TOTVS/Sienge BDI guides)
function calcularPrecoVenda(custoTotal: Decimal, bdiPercent: Decimal): Decimal {
  return custoTotal.mul(new Decimal(1).add(bdiPercent.div(100)))
}

// Item-level: custo = quantidade * custoUnitario
// Obra-level venda = SUM(item costs) * (1 + BDI/100)
```

### Pattern 3: Curva ABC de Insumos

**What:** Server-side SQL with window function for running percentage. No chart library needed — displayed as a sorted table with ABC category badges.

**Example:**
```typescript
// Source: domain research — Pareto-based ABC classification standard in Brazilian construction
const result = await prisma.$queryRaw`
  SELECT
    i.id,
    i.descricao,
    i.unidade,
    (i.quantidade * i."custoUnitario") AS valor_total,
    SUM(i.quantidade * i."custoUnitario") OVER (
      ORDER BY (i.quantidade * i."custoUnitario") DESC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) / SUM(i.quantidade * i."custoUnitario") OVER () * 100 AS percentual_acumulado
  FROM "OrcamentoItem" i
  WHERE i."orcamentoId" = ${orcamentoId}
  ORDER BY valor_total DESC
`
// A: percentual_acumulado <= 50, B: <= 80, C: > 80
// (thresholds vary; 50/80/100 is standard Brazilian practice per i9orcamentos.com.br)
```

### Pattern 4: Excel/CSV Import via SheetJS

**What:** User uploads .xlsx or .csv via file input; server action reads the buffer with SheetJS, maps columns to `OrcamentoItem` schema, validates with Zod, bulk-creates rows.

**When to use:** Plan 04-01 import modal only.

**Example:**
```typescript
// Source: SheetJS official docs — https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
import XLSX from "xlsx"

export async function importOrcamentoFromSheet(formData: FormData) {
  const file = formData.get("file") as File
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  // Validate and map rows to OrcamentoItem schema
  const items = rows.map((row) => itemImportSchema.parse(row))
  // bulk create...
}
```

**Column mapping defaults (user-visible in import modal):**
- Descricao → col A (or "descricao", "description")
- Quantidade → col B (or "qtd", "quantidade")
- Unidade → col C (or "un", "unid")
- Custo Unitario → col D (or "custo", "preco")
- Etapa → col E (optional — creates new etapa if not found)

### Pattern 5: PDF Generation via BullMQ + @react-pdf/renderer

**What:** Server action enqueues a job; API BullMQ worker renders a React PDF template, uploads to R2, updates DB with the r2Key, emits socket event "pdf-ready" to obra room. Client polls or listens.

**When to use:** `PropostaComercial` (Plan 04-02), `PedidoCompra` (Plan 04-03), `BoletimMedicao` (Plan 04-05).

**Example worker pattern:**
```typescript
// Source: adapted from existing pdf-conversion.worker.ts pattern in project
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { PedidoCompraPdf } from "../pdf-templates/PedidoCompra"

export const pdfGenerationWorker = new Worker<PdfGenerationJobData>(
  "pdf-generation",
  async (job) => {
    const { type, entityId, obraId } = job.data

    const data = await fetchDataForPdf(type, entityId)
    const buffer = await renderToBuffer(createElement(templateFor(type), data))

    const r2Key = `pdfs/${type}/${entityId}.pdf`
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: buffer,
      ContentType: "application/pdf",
    }))

    await updateEntityPdfKey(type, entityId, r2Key)

    if (ioInstance) {
      ioInstance.to(`obra:${obraId}`).emit("pdf-ready", { type, entityId, r2Key })
    }
  },
  { connection, concurrency: 3 }
)
```

### Pattern 6: Mapa Comparativo de Cotacoes

**What:** A server-rendered table component. Data shape: `cotacoes` grouped by `fornecedorId`. Columns = fornecedores, rows = itens da requisicao. Minimum price per row highlighted.

**Data transformation (server-side):**
```typescript
// No library needed — pure TypeScript transformation
type MapaRow = {
  itemId: string
  descricao: string
  quantidade: number
  unidade: string
  precos: Record<string, number | null> // fornecedorId -> preco
  menorPreco: number | null
  melhorFornecedorId: string | null
}

function buildMapa(itens: RequisicaoItem[], cotacoes: CompraCotacaoItem[]): MapaRow[] {
  return itens.map((item) => {
    const precos: Record<string, number | null> = {}
    cotacoes
      .filter((c) => c.itemId === item.id)
      .forEach((c) => { precos[c.fornecedorId] = c.precoUnitario })
    const valores = Object.values(precos).filter(Boolean) as number[]
    const menorPreco = valores.length > 0 ? Math.min(...valores) : null
    const melhorFornecedorId = menorPreco
      ? Object.entries(precos).find(([, v]) => v === menorPreco)?.[0] ?? null
      : null
    return { ...item, precos, menorPreco, melhorFornecedorId }
  })
}
```

### Pattern 7: Weighted Progress (Medicao Fisica)

**What:** Progress of the obra is a weighted average by `valorTotal` of each `OrcamentoItem`.

**Formula (confirmed by domain research):**
```typescript
// progressoGeral = SUM(item.valorTotal * item.percentualExecutado) / SUM(item.valorTotal)
function calcularProgressoPonderado(itens: Array<{ valorTotal: Decimal; percentualExecutado: number }>): number {
  const totalValor = itens.reduce((acc, i) => acc.add(i.valorTotal), new Decimal(0))
  if (totalValor.isZero()) return 0
  const progressoPonderado = itens.reduce(
    (acc, i) => acc.add(i.valorTotal.mul(i.percentualExecutado / 100)),
    new Decimal(0)
  )
  return progressoPonderado.div(totalValor).mul(100).toDecimalPlaces(1).toNumber()
}
```

### Pattern 8: Aprovacao Workflow (Requisicoes + Medicoes)

**What:** Reuse existing notification pattern. Status enums drive UI state. Server action checks role before updating status and calls `emitNotification`.

**Status flows:**
- Requisicao: `PENDENTE -> APROVADA -> EM_COTACAO -> PEDIDO_CRIADO -> ENTREGUE | CANCELADA`
- Medicao: `PENDENTE -> APROVADA | REJEITADA`

**Server action pattern:**
```typescript
export async function approveRequisicao(requisicaoId: string) {
  const { session, empresa, tenantClient } = await getTenantContext()
  const permError = requireAdminOrEngenheiro(session.user.role)
  if (permError) return permError

  const requisicao = await tenantClient.compraRequisicao.update({
    where: { id: requisicaoId },
    data: { status: "APROVADA", aprovadoPor: session.user.id, aprovadoEm: new Date() },
    include: { obra: true, solicitadoPorUser: true },
  })

  // notify requester
  await emitNotification(
    requisicao.obraId,
    "requisicao-aprovada",
    { requisicaoId },
    [requisicao.solicitadoPor],
    "requisicao_aprovada",
    { obraId: requisicao.obraId, requisicaoId, authorName: session.user.name }
  )

  revalidatePath(`/dashboard/obras/${requisicao.obraId}/compras`)
}
```

### Anti-Patterns to Avoid

- **Storing precoVenda in DB:** Never store the BDI-adjusted price. Always derive it at query/display time to avoid stale data when BDI changes.
- **ILIKE for SINAPI search with 50k rows:** Use tsvector GIN; ILIKE without index causes full table scans.
- **npm install xlsx:** The npm registry version (0.18.5) has known CVEs; install from CDN only.
- **Decimal as JS float:** Always use `Decimal.js` (Prisma native) or `Decimal` type for financial values; never `number` for money.
- **Generating PDF synchronously in a server action:** Always queue to BullMQ and return immediately; PDF rendering can take 2-10 seconds.
- **Blocking estoque insert inside deliverPedido:** `deliverPedido` server action must atomically update pedido status AND create `MovimentacaoEstoque` in a Prisma `$transaction` to prevent inventory gaps on failure.

---

## Prisma Schema (Phase 4 Models)

Full proposed additions to `packages/db/prisma/schema.prisma`:

```prisma
// ---- Phase 4: Orcamento ----

model Orcamento {
  id          String          @id @default(cuid())
  tenantId    String
  obraId      String          @unique  // one orcamento per obra
  obra        Obra            @relation(fields: [obraId], references: [id])
  bdi         Decimal         @default(0) @db.Decimal(5, 2)  // e.g., 23.50 = 23.5%
  etapas      OrcamentoEtapa[]
  medicoesFisicas MedicaoFisica[]
  pdfR2Key    String?         // proposta comercial PDF
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([tenantId])
}

model OrcamentoEtapa {
  id          String           @id @default(cuid())
  tenantId    String
  orcamentoId String
  orcamento   Orcamento        @relation(fields: [orcamentoId], references: [id])
  nome        String           // "Fundacao", "Alvenaria"
  ordem       Int
  itens       OrcamentoItem[]
  createdAt   DateTime         @default(now())

  @@index([orcamentoId])
  @@index([tenantId])
}

model OrcamentoItem {
  id              String         @id @default(cuid())
  tenantId        String
  etapaId         String
  etapa           OrcamentoEtapa @relation(fields: [etapaId], references: [id])
  sinapiCodigo    String?        // null if manually entered
  descricao       String
  unidade         String         // "m2", "un", "h"
  quantidade      Decimal        @db.Decimal(12, 4)
  custoUnitario   Decimal        @db.Decimal(12, 4)
  requisicoes     CompraRequisicao[]
  medicaoItens    MedicaoFisicaItem[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([etapaId])
  @@index([tenantId])
}

model SinapiComposicao {
  id            String   @id @default(cuid())
  codigo        String   @unique
  descricao     String   @db.Text
  unidade       String
  custoUnitario Decimal  @db.Decimal(12, 4)
  estado        String   @db.Char(2)
  referencia    String   // "03/2026"

  @@index([estado, referencia])
}

// ---- Phase 4: Compras ----

enum RequisicaoStatus {
  PENDENTE
  APROVADA
  EM_COTACAO
  PEDIDO_CRIADO
  ENTREGUE
  CANCELADA
}

enum PedidoStatus {
  RASCUNHO
  ENVIADO
  CONFIRMADO
  ENTREGUE
  CANCELADO
}

model Fornecedor {
  id         String    @id @default(cuid())
  tenantId   String
  empresaId  String
  empresa    Empresa   @relation(fields: [empresaId], references: [id])
  nome       String
  cnpj       String?
  contato    String?
  email      String?
  telefone   String?
  categorias String[]  // ["materiais", "servicos", "equipamentos"]
  cotacoes   CompraCotacao[]
  pedidos    CompraPedido[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([empresaId])
  @@index([tenantId])
}

model CompraRequisicao {
  id              String            @id @default(cuid())
  tenantId        String
  obraId          String
  obra            Obra              @relation(fields: [obraId], references: [id])
  orcamentoItemId String?
  orcamentoItem   OrcamentoItem?    @relation(fields: [orcamentoItemId], references: [id])
  descricao       String
  quantidade      Decimal           @db.Decimal(12, 4)
  unidade         String
  status          RequisicaoStatus  @default(PENDENTE)
  solicitadoPor   String            // User.id
  aprovadoPor     String?           // User.id
  aprovadoEm      DateTime?
  urgente         Boolean           @default(false)
  observacoes     String?           @db.Text
  cotacoes        CompraCotacao[]
  pedido          CompraPedido?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([obraId])
  @@index([tenantId])
}

model CompraCotacao {
  id             String           @id @default(cuid())
  tenantId       String
  requisicaoId   String
  requisicao     CompraRequisicao @relation(fields: [requisicaoId], references: [id])
  fornecedorId   String
  fornecedor     Fornecedor       @relation(fields: [fornecedorId], references: [id])
  precoUnitario  Decimal          @db.Decimal(12, 4)
  prazoEntrega   Int?             // dias
  condicaoPgto   String?
  observacoes    String?          @db.Text
  createdAt      DateTime         @default(now())

  @@unique([requisicaoId, fornecedorId])
  @@index([requisicaoId])
  @@index([tenantId])
}

model CompraPedido {
  id             String           @id @default(cuid())
  tenantId       String
  obraId         String
  obra           Obra             @relation(fields: [obraId], references: [id])
  requisicaoId   String           @unique
  requisicao     CompraRequisicao @relation(fields: [requisicaoId], references: [id])
  fornecedorId   String
  fornecedor     Fornecedor       @relation(fields: [fornecedorId], references: [id])
  status         PedidoStatus     @default(RASCUNHO)
  valorTotal     Decimal          @db.Decimal(12, 2)
  previsaoEntrega DateTime?
  pdfR2Key       String?          // generated PDF key in R2
  entregueEm     DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([obraId])
  @@index([tenantId])
}

// ---- Phase 4: Estoque ----

enum MovimentacaoTipo {
  ENTRADA
  SAIDA
  TRANSFERENCIA
}

model Deposito {
  id          String              @id @default(cuid())
  tenantId    String
  obraId      String
  obra        Obra                @relation(fields: [obraId], references: [id])
  nome        String              // "Almoxarifado Central", "Canteiro"
  movimentacoes MovimentacaoEstoque[]
  createdAt   DateTime            @default(now())

  @@index([obraId])
  @@index([tenantId])
}

model MovimentacaoEstoque {
  id              String           @id @default(cuid())
  tenantId        String
  depositoId      String
  deposito        Deposito         @relation(fields: [depositoId], references: [id])
  depositoDestinoId String?        // only for TRANSFERENCIA
  tipo            MovimentacaoTipo
  descricao       String           // material name
  unidade         String
  quantidade      Decimal          @db.Decimal(12, 4)
  quantidadeMinima Decimal?        @db.Decimal(12, 4)  // for low-stock alert
  pedidoId        String?          // CompraRequisicao.id — links entry to purchase
  tarefaId        String?          // Tarefa.id — links exit to task (optional)
  etapaId         String?          // OrcamentoEtapa.id — links exit to budget stage (optional)
  observacoes     String?          @db.Text
  autorId         String           // User.id
  createdAt       DateTime         @default(now())

  @@index([depositoId])
  @@index([tenantId])
}

// ---- Phase 4: Medicoes ----

enum MedicaoStatus {
  PENDENTE
  APROVADA
  REJEITADA
}

model MedicaoFisica {
  id            String              @id @default(cuid())
  tenantId      String
  obraId        String
  obra          Obra                @relation(fields: [obraId], references: [id])
  orcamentoId   String
  orcamento     Orcamento           @relation(fields: [orcamentoId], references: [id])
  periodo       String              // "03/2026" — reference month
  status        MedicaoStatus       @default(PENDENTE)
  progressoGeral Decimal?           @db.Decimal(5, 2)  // calculated weighted avg
  aprovadoPor   String?
  aprovadoEm    DateTime?
  itens         MedicaoFisicaItem[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([obraId])
  @@index([tenantId])
}

model MedicaoFisicaItem {
  id                  String        @id @default(cuid())
  tenantId            String
  medicaoId           String
  medicao             MedicaoFisica @relation(fields: [medicaoId], references: [id])
  orcamentoItemId     String
  orcamentoItem       OrcamentoItem @relation(fields: [orcamentoItemId], references: [id])
  percentualExecutado Decimal       @db.Decimal(5, 2)  // 0-100
  createdAt           DateTime      @default(now())

  @@unique([medicaoId, orcamentoItemId])
  @@index([medicaoId])
}

model MedicaoContrato {
  id             String               @id @default(cuid())
  tenantId       String
  obraId         String
  obra           Obra                 @relation(fields: [obraId], references: [id])
  empreiteiroNome String
  empreiteiroCnpj String?
  periodo        String               // "03/2026"
  status         MedicaoStatus        @default(PENDENTE)
  aprovadoPor    String?
  aprovadoEm     DateTime?
  pdfR2Key       String?
  itens          MedicaoContratoItem[]
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt

  @@index([obraId])
  @@index([tenantId])
}

model MedicaoContratoItem {
  id              String          @id @default(cuid())
  tenantId        String
  medicaoId       String
  medicao         MedicaoContrato @relation(fields: [medicaoId], references: [id])
  descricao       String
  unidade         String
  quantidadeContratada Decimal    @db.Decimal(12, 4)
  quantidadeExecutada  Decimal    @db.Decimal(12, 4)
  valorUnitario   Decimal         @db.Decimal(12, 4)
  createdAt       DateTime        @default(now())

  @@index([medicaoId])
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SINAPI full-text search | Custom tokenizer or ILIKE | PostgreSQL `tsvector` + GIN + `plainto_tsquery` | Handles Portuguese stemming, accent folding, compound words out of the box |
| Excel/CSV parsing | File buffer parsing loop | SheetJS `XLSX.read()` + `sheet_to_json()` | Handles XLS, XLSX, CSV, ODS formats; cell type coercion; merged cells |
| PDF generation | HTML string concatenation | `@react-pdf/renderer` with JSX templates | Type-safe, composable, no headless browser needed |
| Running total / Curva ABC | JavaScript sort+reduce | PostgreSQL window function `SUM OVER()` | Runs in DB, handles large orcamentos, no data transfer |
| Prisma transactions | Manual try/catch + rollback | `prisma.$transaction([...])` | ACID guarantees on deliverPedido → estoque entry |
| Decimal arithmetic | JS `number` type | Prisma `Decimal` / `Decimal.js` | Floating-point errors in money calculations are unacceptable |

**Key insight:** The financial domain demands precision (Decimal) and atomicity (transactions). Every money value must be `Decimal` in Prisma schema and the JS `Decimal` object in code — never `number`.

---

## Common Pitfalls

### Pitfall 1: BDI Applied at Item Level Instead of Obra Level

**What goes wrong:** Applying BDI percentage to each item individually instead of the total, causing rounding errors across hundreds of items and a final total that differs from the expected `custoTotal * (1 + BDI)`.

**Why it happens:** Intuitive to multiply at item level when building a table view.

**How to avoid:** Store only `custoUnitario` and `quantidade` per item. Calculate `custoTotal` by summing items. Apply BDI once: `precoVenda = custoTotal * (1 + bdi/100)`. Never store `precoVenda`.

**Warning signs:** Total venda does not match manual calculator verification.

### Pitfall 2: SheetJS Installed from npm Registry

**What goes wrong:** `pnpm add xlsx` installs the stale 0.18.5 version from npm with known Prototype Pollution and ReDoS vulnerabilities.

**Why it happens:** npm registry entry appears valid; package seems to install normally.

**How to avoid:** Always install from CDN: `pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. Verify in `package.json` that the version shows as a CDN URL, not `^0.18.5`.

**Warning signs:** `package.json` shows `"xlsx": "^0.18.5"` — this is the vulnerable version.

### Pitfall 3: Estoque Saldo Goes Negative

**What goes wrong:** Race condition between two simultaneous `SAIDA` entries both reading the same current stock level and both succeeding, resulting in negative inventory.

**Why it happens:** Saldo (current balance) is computed by summing all `MovimentacaoEstoque` rows — there is no atomic check.

**How to avoid:** Add a check query inside a `prisma.$transaction`: read current saldo, verify `saldo >= quantidade`, then insert `SAIDA`. If check fails, return `{ error: "Estoque insuficiente" }`.

**Warning signs:** `MovimentacaoEstoque` entries show net negative quantities when summed per deposito + descricao.

### Pitfall 4: SINAPI State Mismatch

**What goes wrong:** SINAPI prices vary significantly by state (SP costs can be 20-40% higher than CE). Using SP prices for a CE obra leads to systematically wrong budgets.

**Why it happens:** SINAPI data is seeded with a specific `estado`; the search doesn't filter by obra location.

**How to avoid:** Seed one state initially (most common user state, or let user select in settings). Filter all SINAPI queries by `estado` matching the obra's `estado` field. Display the reference state and month prominently in the search UI.

**Warning signs:** Budget items have `sinapiCodigo` set but `estado` in search doesn't match `obra.estado`.

### Pitfall 5: PDF Generation Blocking Server Action Response

**What goes wrong:** Calling `renderToBuffer()` synchronously inside a Server Action causes 5-15 second response times; Next.js may time out; user sees loading state indefinitely.

**Why it happens:** PDF rendering is CPU-intensive; `@react-pdf/renderer` computes layout for all document pages synchronously.

**How to avoid:** Always enqueue to BullMQ and return immediately. Return `{ status: "queued" }` to client. Client shows "Gerando PDF..." state and listens for `"pdf-ready"` socket event to show download link.

**Warning signs:** Server action response time > 2 seconds for any PDF route.

### Pitfall 6: tsvector for SINAPI Not Created After Migration

**What goes wrong:** Prisma migration creates the `SinapiComposicao` table but does NOT create the `tsvector` generated column or GIN index because Prisma doesn't natively support `GENERATED ALWAYS AS` for tsvector.

**Why it happens:** Prisma schema uses `Unsupported("tsvector")` which signals Prisma to skip the column in migrations.

**How to avoid:** Create a manual migration file after the Prisma migration:
```sql
-- Run once after prisma migrate deploy
ALTER TABLE "SinapiComposicao"
  ADD COLUMN IF NOT EXISTS "searchVec" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce("descricao", '') || ' ' || "codigo")
  ) STORED;
CREATE INDEX IF NOT EXISTS "SinapiComposicao_searchVec_idx"
  ON "SinapiComposicao" USING GIN ("searchVec");
```

**Warning signs:** SINAPI search returns zero results despite seeded data.

---

## Code Examples

### Seed SINAPI from Excel (one-time script)

```typescript
// scripts/seed-sinapi.ts — run once per monthly SINAPI update
import XLSX from "xlsx"
import { prisma } from "@projetapro/db"

async function seedSinapi(filePath: string, estado: string, referencia: string) {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<{
    CODIGO: string
    DESCRICAO: string
    UNIDADE: string
    CUSTO_UNITARIO: number
  }>(sheet)

  await prisma.sinapiComposicao.createMany({
    data: rows.map((r) => ({
      codigo: String(r.CODIGO).trim(),
      descricao: r.DESCRICAO.trim(),
      unidade: r.UNIDADE.trim(),
      custoUnitario: r.CUSTO_UNITARIO,
      estado,
      referencia,
    })),
    skipDuplicates: true,
  })
  console.log(`Seeded ${rows.length} SINAPI composicoes for ${estado} ${referencia}`)
}
```

### Low Stock Alert Check (after SAIDA movement)

```typescript
// In estoque server action — after creating MovimentacaoEstoque of tipo=SAIDA
async function checkLowStock(depositoId: string, descricao: string, tenantId: string) {
  const agg = await prisma.movimentacaoEstoque.aggregate({
    where: { depositoId, descricao },
    _sum: {
      // ENTRADA/DEVOLUCAO positive, SAIDA/PERDA negative via signed quantity
    },
  })
  // Compute saldo; compare to quantidadeMinima on last ENTRADA for this material
  // If saldo < minimo, emit in-app notification
}
```

### Approval Status Badge Mapping

```typescript
const REQUISICAO_STATUS_CONFIG = {
  PENDENTE:      { label: "Pendente",       color: "yellow" },
  APROVADA:      { label: "Aprovada",       color: "green"  },
  EM_COTACAO:    { label: "Em Cotacao",     color: "blue"   },
  PEDIDO_CRIADO: { label: "Pedido Criado",  color: "indigo" },
  ENTREGUE:      { label: "Entregue",       color: "emerald" },
  CANCELADA:     { label: "Cancelada",      color: "red"    },
} as const
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm install xlsx | CDN install from cdn.sheetjs.com | 2022 | Security — npm version has known CVEs |
| Puppeteer for PDF | @react-pdf/renderer v4 for structured docs | 2023-2024 | No headless browser binary; JSX templates |
| String-based tsvector update | GENERATED ALWAYS AS (stored tsvector) | PostgreSQL 12+ | Automatic, no trigger needed |
| Float for money | Prisma Decimal / Decimal.js | Always best practice | Eliminates floating-point errors |

**Deprecated/outdated:**
- `xlsx@0.18.5` from npm: Do not use — replaced by CDN installation.
- Puppeteer for simple document PDFs: Overkill for purchase orders and measurement reports; `@react-pdf/renderer` is lighter and sufficient.

---

## Open Questions

1. **SINAPI estado selection for multi-state empresas**
   - What we know: SINAPI prices vary by state; `Obra.estado` exists in schema
   - What's unclear: Whether to seed all 27 states or just one default state initially
   - Recommendation: Seed SP only for MVP (most common market); add a settings field `Empresa.sinapiEstado` for future multi-state support. Show reference state in the search UI.

2. **SINAPI referencia (monthly update)**
   - What we know: CAIXA releases new tables monthly; prices change
   - What's unclear: Whether existing orcamentos should auto-update when new SINAPI is seeded
   - Recommendation: Lock orcamento items to the `referencia` at time of addition; do NOT auto-update. User can manually re-search and update. This matches industry practice (orcamentos are fixed contracts).

3. **Curva ABC: Insumos vs Servicos**
   - What we know: Brazilian practice distinguishes Curva ABC de Insumos (materials) from Curva ABC de Servicos (labor/services)
   - What's unclear: Whether to show both or just insumos for Phase 4
   - Recommendation: Show one unified list sorted by `valorTotal` with an optional filter toggle. Label the section "Curva ABC de Insumos" per CONTEXT.md.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.9 |
| Config file | `apps/web/vitest.config.ts` (exists) |
| Quick run command | `pnpm --filter web test -- --reporter=dot` |
| Full suite command | `pnpm --filter web test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORC-01 | SINAPI search returns ranked results | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "sinapi"` | Wave 0 |
| ORC-02 | createOrcamentoItem stores correct Decimal values | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "createItem"` | Wave 0 |
| ORC-03 | BDI calculation: venda = custo * (1 + bdi/100) | unit | `pnpm --filter web test -- tests/lib/orcamento.test.ts -t "bdi"` | Wave 0 |
| ORC-04 | importOrcamentoFromSheet parses XLSX rows | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "import"` | Wave 0 |
| ORC-05 | buildCurvaABC returns correct percentual_acumulado | unit | `pnpm --filter web test -- tests/lib/orcamento.test.ts -t "curva"` | Wave 0 |
| ORC-06 | PDF generation job is enqueued to BullMQ | unit | `pnpm --filter web test -- tests/actions/orcamento.test.ts -t "pdf"` | Wave 0 |
| COMP-01 | createRequisicao links to orcamentoItemId | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "createRequisicao"` | Wave 0 |
| COMP-02 | approveRequisicao: ENGENHEIRO can approve; CLIENTE cannot | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "approve"` | Wave 0 |
| COMP-03 | buildMapa produces correct row/column structure | unit | `pnpm --filter web test -- tests/lib/compras.test.ts -t "mapa"` | Wave 0 |
| COMP-04 | createPedido enqueues PDF job | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "pedido"` | Wave 0 |
| COMP-05 | deliverPedido creates MovimentacaoEstoque ENTRADA | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "deliver"` | Wave 0 |
| COMP-06 | createFornecedor scoped to empresaId, not obraId | unit | `pnpm --filter web test -- tests/actions/compras.test.ts -t "fornecedor"` | Wave 0 |
| MED-01 | calcularProgressoPonderado weighted average is correct | unit | `pnpm --filter web test -- tests/lib/medicoes.test.ts -t "progresso"` | Wave 0 |
| MED-02 | createMedicaoContrato accumulates period totals | unit | `pnpm --filter web test -- tests/actions/medicoes.test.ts -t "contrato"` | Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter web test -- --reporter=dot` (run new test file)
- **Per wave merge:** `pnpm --filter web test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/tests/actions/orcamento.test.ts` — covers ORC-01, ORC-02, ORC-04, ORC-06
- [ ] `apps/web/tests/actions/compras.test.ts` — covers COMP-01, COMP-02, COMP-04, COMP-05, COMP-06
- [ ] `apps/web/tests/actions/medicoes.test.ts` — covers MED-02
- [ ] `apps/web/tests/lib/orcamento.test.ts` — covers ORC-03, ORC-05 (pure functions, no mocks needed)
- [ ] `apps/web/tests/lib/compras.test.ts` — covers COMP-03 (buildMapa pure function)
- [ ] `apps/web/tests/lib/medicoes.test.ts` — covers MED-01 (calcularProgressoPonderado pure function)
- [ ] API package: install `@react-pdf/renderer` — `pnpm --filter api add @react-pdf/renderer`
- [ ] Web package: install SheetJS from CDN — `pnpm --filter web add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`

---

## Sources

### Primary (HIGH confidence)

- SheetJS official docs (https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) — install method, Buffer API, Next.js caveat
- PostgreSQL official docs (https://www.postgresql.org/docs/current/textsearch-tables.html) — tsvector GENERATED ALWAYS AS, GIN index, plainto_tsquery
- @react-pdf/renderer npm (https://www.npmjs.com/package/@react-pdf/renderer) — version 4.3.2, renderToBuffer API, React 19 compatibility
- Existing project codebase — confirmed patterns: BullMQ worker, R2 upload, emitNotification, getTenantContext, EtapaForm modal, Prisma Decimal, vitest test mocks

### Secondary (MEDIUM confidence)

- TOTVS BDI guide (https://www.totvs.com/blog/gestao-para-construcao/bdi/) — BDI formula components, typical 10-20% range
- i9 Orcamentos SINAPI guide (https://www.i9orcamentos.com.br/curva-abc-orcamento-de-obras/) — Curva ABC thresholds (A<=50%, B<=80%, C>80%)
- Sienge Mapa de Cotacao (https://sienge.com.br/blog/mapa-de-cotacao-saiba-o-que-e-como-fazer-o-seu/) — confirmed row/column layout standard in Brazilian construction ERP
- GoEPIK Boletim de Medicao (https://www.goepik.com.br/boletim-de-medicao/) — BM formula: (Executed Qty / Total Qty) * Contracted Value; cumulative history pattern

### Tertiary (LOW confidence)

- Web search: SINAPI seed script examples — no authoritative open-source seed script found; column mapping inferred from CAIXA Excel format descriptions. Validate column headers when downloading the actual CAIXA file.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all major libraries verified against official docs and existing project
- Architecture: HIGH — patterns directly derived from existing Phase 1-3 code with confirmed extension points
- SINAPI domain: MEDIUM — data structure inferred from CAIXA format descriptions; actual column headers must be verified when downloading the real Excel file from CAIXA
- Pitfalls: HIGH — SheetJS CVE confirmed; BDI rounding confirmed by domain research; tsvector gap is a known Prisma limitation; Decimal vs float is universal best practice
- PDF generation: HIGH — @react-pdf/renderer v4.3.2 confirmed on npm, renderToBuffer confirmed working server-side

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 for standard stack; 2026-04-01 for SINAPI referencia (new monthly tables released)
