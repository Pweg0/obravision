# Phase 1: Foundation - Research

**Researched:** 2026-03-13
**Domain:** Auth, multi-tenant CRUD, onboarding, roles/invites, landing page — Next.js 15 + Fastify 5 + PostgreSQL 16 RLS
**Confidence:** HIGH (core stack verified via official docs and prior project research)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Monorepo pnpm workspaces: apps/web (Next.js 15), apps/api (Fastify 5), packages/db (Prisma 5)
- PostgreSQL 16 + RLS multi-tenancy (single schema, shared, `tenant_id` on every table)
- Auth.js v5 for authentication — email/password (credentials provider) + Google OAuth
- Prisma 5 ORM
- shadcn/ui + TailwindCSS
- Resend.com for transactional emails (invites, password reset)
- Cloudflare R2 for storage — NOT used in Phase 1, but schema must prepare storage-related fields
- Turborepo for build orchestration
- TypeScript strict mode throughout

### Onboarding Flow (locked)
- 3 steps: criar empresa > criar obra > convidar equipe
- Step 1: apenas nome obrigatorio (CNPJ/endereco/logo deferred)
- Step 2: nome + endereco + tipo (residencial/comercial/reforma) + area obrigatorios
- Step 3: pulavel — convite pode ser feito depois pela tela da obra
- Convite por 2 metodos: email direto (email + role) E link compartilhavel

### Obra Management (locked)
- Toggle cards/tabela no listing
- Status customizaveis (sem lista fixa — usuario cria seus proprios)
- Arquivamento: obra vai para aba "Arquivadas"
- Dados v1: nome, endereco, tipo, area apenas

### Dashboard (locked)
- Estrutura visual completa desde Phase 1
- Lista de obras e atividade recente funcionais
- Widgets clima e comentarios pendentes: placeholders (dados nas Phases 2/3)

### Landing Page (locked)
- Referencia: Mais Controle (maiscontroleerp.com.br) — tom profissional, execucao moderna
- Secoes: Hero com CTA + features do produto
- Sem pricing, sem social proof no v1
- Formulario: apenas email + botao "Quero testar"
- Mesmo dominio: / = landing, /app = area logada

### Roles (locked)
- 3 roles: Admin, Engenheiro, Cliente
- Admin: acesso total, multiplos por empresa, sem "owner" separado
- Engenheiro: edita tudo da obra, nao gerencia membros nem billing
- Cliente: permissoes customizaveis por obra (admin define)
- Quem convida: Admin e Engenheiro

### Claude's Discretion
- Filtros da listagem de obras (Claude escolhe os mais uteis)
- Design exato dos cards e tabela de obras
- Loading states e skeletons
- Layout exato do dashboard e widgets
- Paleta de cores e tipografia: Verde Obra #1A6B5A, Inter font (ja definidos)
- Error states e validacoes de formulario

### Deferred Ideas (OUT OF SCOPE)
- Pricing table na landing page — Phase 2 (billing)
- Social proof/depoimentos — depois de ter beta testers
- Dashboard widgets com dados reais de clima e comentarios — Phases 2 e 3
- Notificacoes in-app — Phase 2 (WebSocket)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Auth.js v5 CredentialsProvider + bcrypt + Prisma adapter; JWT session strategy |
| AUTH-02 | User can log in with Google OAuth | Auth.js v5 GoogleProvider; OAuth callback handled natively with Prisma adapter |
| AUTH-03 | User session persists across browser refresh | JWT stored in httpOnly cookie via Auth.js v5; `session()` available in Server Components |
| AUTH-04 | User can reset password via email link | Resend + signed token in DB (expires 1h); no Auth.js magic link — custom flow with Prisma |
| AUTH-05 | User completes onboarding wizard (create empresa > create obra > invite equipe) | 3-step wizard with shadcn/ui stepper; Prisma writes; invite model with token + shareable link |
| OBRA-01 | User can create, edit, and archive obras with status and progress | CRUD routes in Next.js Server Actions or tRPC; Prisma `obra` table; archive = soft-delete flag; custom status via `obra_status` table |
| OBRA-02 | User can invite members with roles (admin, engenheiro, cliente) | `invitation` table (token, email, role, expires, used); dual invite methods: email via Resend + shareable link (token only, no email target) |
| OBRA-03 | User can set obra details (endereco, tipo, area construida) | Prisma schema fields; React Hook Form + Zod validation; endereco as structured fields (logradouro, numero, cidade, estado, CEP) |
| MKT-01 | Public landing page with lead capture form and product showcase | Next.js static page at `/`; `lead` table in Prisma; Resend confirmation email; Vercel-hosted, no auth required |
</phase_requirements>

---

## Summary

Phase 1 is the complete foundation: a working, deployed product that a real engineer can sign up for, create a obra, invite teammates, and start using within 5 minutes. Every architectural choice made here becomes load-bearing for all future phases. The most critical decisions are the database schema (RLS policies, `tenant_id` on every table, schema designed to support R2 storage even though it is not used yet) and the authentication session model (JWT strategy required because Auth.js credentials provider cannot use database sessions cleanly).

This phase has high implementation coupling: auth depends on the user/empresa/tenant schema, the onboarding wizard depends on auth, obra CRUD depends on the invite system, and the invite system depends on email delivery. Build order must be strictly sequential: monorepo scaffold → schema + RLS → auth → onboarding → obra CRUD → invites → dashboard → landing page.

The primary risk in this phase is RLS misconfiguration. A cross-tenant data leak in a B2B SaaS targeting the conservative Brazilian construction market is a fatal trust violation. Defense-in-depth (RLS + application-layer `WHERE tenant_id = ?` filter + integration tests with two tenants) is non-negotiable.

**Primary recommendation:** Build the Prisma schema and RLS policies first, write the two-tenant isolation integration test immediately after, and do not proceed to any feature work until that test is green.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x (App Router) | Web frontend + Server Actions | React 19 support, Turbopack stable, App Router is the production pattern; Pages Router is in maintenance mode |
| Fastify | 5.x | API server (background jobs, future WebSocket) | Not heavily used in Phase 1 but monorepo must scaffold it; all future phases depend on it |
| PostgreSQL | 16.x | Primary database | RLS support, JSONB for future metadata, `SKIP LOCKED` for job queues |
| Prisma | 5.x | ORM | Schema-first, TypeScript inference, Prisma Studio for solo dev, migration tooling mature |
| Auth.js | v5.x | Authentication | Only solution with first-class App Router support, Prisma adapter, Google OAuth + Credentials in one package |
| shadcn/ui | latest | UI components | Copy-paste, fully customizable, compatible with Next.js 15 + TailwindCSS 4, no runtime dependency |
| TailwindCSS | 4.x | Styling | Used with shadcn; v4 is CSS-first config, no JS config file needed |
| Zod | 3.x | Schema validation | Shared between API + forms; integrates with React Hook Form and tRPC |
| React Hook Form | 7.x | Form management | Uncontrolled inputs, minimal re-renders, `@hookform/resolvers` for Zod integration |
| Resend | latest | Transactional email | React Email templates, first-class Next.js integration, generous free tier, used for invites + password reset |
| Turborepo | latest | Monorepo build orchestration | Build cache, parallel task execution, pnpm workspace awareness |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcryptjs | ^2.4.x | Password hashing | Auth.js credentials provider requires manual hashing; use in server-only code |
| nanoid | ^5.x | Invite token / shareable link generation | Cryptographically secure, URL-safe, shorter than UUID for shareable links |
| @auth/prisma-adapter | latest | Prisma session/account persistence | Required by Auth.js v5 to store OAuth account links and user records |
| react-email | latest | Email template components | Pairs with Resend for invite and password reset emails with React syntax |
| Vitest | 1.x | Unit + integration testing | Fast, ESM-native, runs in CI; used for RLS isolation tests and schema validation |
| next-themes | latest | Dark mode toggle | Wraps shadcn theming; minimal setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Auth.js v5 | Lucia Auth | Lucia gives full control but requires hand-rolling Google OAuth, session tables, CSRF. Auth.js v5 stable ships all of this. Use Lucia only if Auth.js constraints become painful. |
| Auth.js v5 | Better Auth | Better Auth (2024/2025 newcomer) has cleaner API but smaller ecosystem and fewer production case studies. Re-evaluate at Phase 2+ if Auth.js shows pain. |
| bcryptjs | argon2 | argon2 is stronger but requires native bindings; bcryptjs is pure JS and works without any build tooling. For an MVP, bcryptjs is fine. |
| nanoid | crypto.randomBytes | Both are secure; nanoid produces URL-safe strings by default without encoding step. |
| React Hook Form + Zod | Server Actions only | Server Actions validate server-side but give no instant field-level feedback. RHF + Zod gives instant client validation + server re-validation on submit. |

### Installation

```bash
# Monorepo root
pnpm init
pnpm add -D turbo typescript @types/node
echo '{"$schema":"https://turbo.build/schema.json","tasks":{"build":{"outputs":["dist/**",".next/**"]},"dev":{"cache":false,"persistent":true}}}' > turbo.json

# pnpm-workspace.yaml
echo 'packages:\n  - "apps/*"\n  - "packages/*"' > pnpm-workspace.yaml

# apps/web — Next.js
pnpm add next@15 react@19 react-dom@19
pnpm add next-auth@5 @auth/prisma-adapter
pnpm add zod react-hook-form @hookform/resolvers
pnpm add next-themes
pnpm add resend react-email @react-email/components
pnpm add nanoid bcryptjs
pnpm add -D @types/bcryptjs

# shadcn/ui init (run inside apps/web)
pnpm dlx shadcn@latest init

# packages/db — Prisma
pnpm add prisma @prisma/client
pnpm add -D prisma

# Testing
pnpm add -D vitest @vitest/coverage-v8
```

---

## Architecture Patterns

### Recommended Project Structure

```
projetapro/
├── apps/
│   ├── web/                        # Next.js 15 App Router
│   │   ├── app/
│   │   │   ├── (marketing)/        # Landing page, lead capture — no auth
│   │   │   │   └── page.tsx        # MKT-01: Landing page
│   │   │   ├── (auth)/             # Login, register, forgot-password, reset-password
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── reset-password/
│   │   │   ├── onboarding/         # 3-step wizard post-signup — AUTH-05
│   │   │   │   ├── empresa/        # Step 1
│   │   │   │   ├── obra/           # Step 2
│   │   │   │   └── equipe/         # Step 3 (skippable)
│   │   │   └── (dashboard)/        # Protected: all authenticated routes
│   │   │       ├── layout.tsx      # Auth guard + tenant resolution
│   │   │       ├── page.tsx        # Dashboard with obra list + activity
│   │   │       ├── obras/
│   │   │       │   ├── page.tsx    # OBRA-01: listing (cards/table toggle)
│   │   │       │   ├── [id]/       # OBRA-03: detail + edit
│   │   │       │   └── archived/   # OBRA-01: archived obras tab
│   │   │       └── settings/       # Empresa settings, members
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn components (auto-generated)
│   │   │   ├── obra/               # ObraCard, ObraTable, StatusBadge
│   │   │   ├── onboarding/         # StepWrapper, StepEmpresa, StepObra, StepEquipe
│   │   │   ├── invite/             # InviteByEmail, ShareableLink
│   │   │   ├── dashboard/          # DashboardLayout, ObraListWidget, ActivityWidget, PlaceholderWidget
│   │   │   └── marketing/          # HeroSection, FeaturesSection, LeadCaptureForm
│   │   ├── lib/
│   │   │   ├── auth.ts             # Auth.js config (providers, callbacks, adapter)
│   │   │   ├── auth-actions.ts     # Server Actions: login, register, resetPassword
│   │   │   └── validations/        # Zod schemas shared with forms
│   │   └── middleware.ts           # Auth session guard for /dashboard + /onboarding
│   │
│   └── api/                        # Fastify 5 (scaffolded in Phase 1, minimal routes)
│       └── src/
│           ├── app.ts
│           └── plugins/
│               └── tenant.ts       # RLS set_config hook (ready for Phase 2+)
│
└── packages/
    ├── db/                         # Prisma schema + migrations
    │   └── prisma/
    │       ├── schema.prisma       # All models (see Schema Patterns below)
    │       └── migrations/
    └── types/                      # Shared TypeScript types
        └── src/
            ├── auth.ts             # Role enum, session types
            └── obra.ts             # Obra, Status types
```

### Pattern 1: Auth.js v5 with Credentials + Google OAuth

**What:** Auth.js v5 (formerly next-auth) provides a single configuration file (`auth.ts`) exporting `auth`, `signIn`, `signOut`, and `handlers`. The credentials provider requires manual password comparison using bcryptjs. The Prisma adapter handles Google OAuth account linking. Because credentials + Prisma adapter requires JWT session strategy (database sessions require adapter + JWT for credentials), `session: { strategy: 'jwt' }` is mandatory.

**When to use:** Any authentication need in the app — Server Components can call `auth()`, middleware checks session, Server Actions call `signIn`/`signOut`.

**Example:**
```typescript
// packages/db/prisma/schema.prisma — Auth.js required models
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?   // null for OAuth users
  role          Role      @default(ENGENHEIRO)
  empresaId     String?
  empresa       Empresa?  @relation(fields: [empresaId], references: [id])
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// apps/web/lib/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@projetapro/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },  // REQUIRED for credentials provider
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null
        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.empresaId = (user as any).empresaId
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.empresaId = token.empresaId as string | undefined
      session.user.role = token.role as string
      return session
    },
  },
})
```

### Pattern 2: PostgreSQL RLS with Prisma Client Extension

**What:** Every tenant-scoped table has `tenantId` column + RLS policy. Prisma Client Extension wraps every query with `SET LOCAL app.current_tenant_id = ?` inside a transaction. A second application-layer WHERE filter is added as defense-in-depth.

**When to use:** Every authenticated Server Action or API route that reads/writes tenant data.

**Example:**
```typescript
// packages/db/src/rls-client.ts
import { PrismaClient } from "@prisma/client"

export function createTenantClient(tenantId: string) {
  const prisma = new PrismaClient()
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`,
            query(args),
          ])
          return result
        },
      },
    },
  })
}
```

```sql
-- Run in a migration for every tenant-scoped table
ALTER TABLE "obras" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "obras"
  USING ("tenantId" = current_setting('app.current_tenant_id')::text)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text);
```

**Note on `SET LOCAL` vs `SET`:** Use `TRUE` as the third argument to `set_config` (which scopes to the current transaction), and wrap in `$transaction` to ensure the variable is cleared after the query completes. This is safe with connection poolers.

### Pattern 3: Dual Invite System (Email + Shareable Link)

**What:** Two invite flows from the same `Invitation` table. Email invites have a target email + role pre-set. Shareable link invites have no email target (anyone with the link can join with the pre-set role). Both use a short nanoid token. Shareable links can be revoked by generating a new token.

**When to use:** OBRA-02 — inviting team members during onboarding Step 3 or from obra settings.

**Example:**
```typescript
// packages/db/prisma/schema.prisma
model Invitation {
  id        String    @id @default(cuid())
  token     String    @unique @default(cuid())  // use nanoid(21) in application layer
  email     String?   // null = shareable link (anyone can use)
  role      Role
  obraId    String?   // null = empresa-level invite
  obra      Obra?     @relation(fields: [obraId], references: [id])
  empresaId String
  empresa   Empresa   @relation(fields: [empresaId], references: [id])
  invitedBy String    // User.id
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

// Server Action: create invite by email
async function inviteByEmail(email: string, role: Role, obraId: string) {
  const token = nanoid(21)
  await prisma.invitation.create({
    data: {
      token,
      email,
      role,
      obraId,
      empresaId: session.user.empresaId,
      invitedBy: session.user.id,
      expiresAt: addDays(new Date(), 7),
    }
  })
  await resend.emails.send({
    from: "ProjetaPro <noreply@projetapro.com.br>",
    to: email,
    subject: "Voce foi convidado para uma obra",
    react: InviteEmail({ token, role }),
  })
}

// Server Action: accept invite
async function acceptInvite(token: string) {
  const invite = await prisma.invitation.findUnique({ where: { token } })
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    throw new Error("Convite invalido ou expirado")
  }
  if (invite.email && invite.email !== session.user.email) {
    throw new Error("Este convite e para outro email")
  }
  // Add user to empresa/obra with the role
  await prisma.$transaction([
    prisma.empresaMember.create({ data: { userId: session.user.id, empresaId: invite.empresaId, role: invite.role } }),
    prisma.invitation.update({ where: { token }, data: { usedAt: new Date() } }),
  ])
}
```

### Pattern 4: 3-Step Onboarding Wizard (Server Actions)

**What:** A multi-step form using URL segments (`/onboarding/empresa`, `/onboarding/obra`, `/onboarding/equipe`). Each step is a separate page with a Server Action. Completion of each step stores data and redirects to the next. Step 3 has an explicit "Pular" button that marks onboarding complete without inviting anyone.

**When to use:** AUTH-05 — immediately after first login (before empresa is set on the user).

**Example:**
```typescript
// apps/web/middleware.ts — redirect to onboarding if empresaId is missing
export default async function middleware(req: NextRequest) {
  const session = await auth()
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding")

  if (session && !session.user.empresaId && isProtected) {
    return NextResponse.redirect(new URL("/onboarding/empresa", req.url))
  }
  if (!session && (isProtected || isOnboarding)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

// Server Action: complete Step 1
async function createEmpresa(formData: FormData) {
  "use server"
  const session = await auth()
  const nome = formData.get("nome") as string
  const empresa = await prisma.empresa.create({ data: { nome, tenantId: generateTenantId() } })
  await prisma.user.update({ where: { id: session!.user.id }, data: { empresaId: empresa.id, role: "ADMIN" } })
  redirect("/onboarding/obra")
}
```

### Pattern 5: Obra Listing with Toggle (Cards/Table)

**What:** Client-side toggle stored in localStorage (via Zustand persist). Both views load the same data from a single Server Component fetch. Cards show: cover image placeholder, status badge, obra name, tipo, area, progress bar (0% placeholder in Phase 1). Table shows: name, status, tipo, area, created date, actions.

**When to use:** OBRA-01 — `/dashboard/obras` listing page.

**Example:**
```typescript
// Zustand store for view preference
const useObraViewStore = create(
  persist<{ view: "cards" | "table"; setView: (v: "cards" | "table") => void }>(
    (set) => ({ view: "cards", setView: (view) => set({ view }) }),
    { name: "obra-view-preference" }
  )
)
```

### Pattern 6: Custom Obra Status

**What:** No fixed status enum in the DB. Status is a separate table per empresa. Each obra has a `statusId` FK. Empresa creates statuses with name + color hex. First status created auto-assigns to new obras.

**Example:**
```typescript
model ObraStatus {
  id        String  @id @default(cuid())
  name      String  // "Em execucao", "Paralisada", "Concluida" — user-defined
  color     String  // hex color "#1A6B5A"
  empresaId String
  empresa   Empresa @relation(fields: [empresaId], references: [id])
  obras     Obra[]
  tenantId  String
  @@index([empresaId])
}
```

### Pattern 7: Password Reset Flow (Custom — Not Auth.js Magic Link)

**What:** Custom flow because Auth.js magic links require a specific provider setup that conflicts with credentials. Use a `PasswordResetToken` table with expiry. Resend sends the link. The reset page validates token + updates passwordHash.

**Example:**
```typescript
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}
// Flow: POST /forgot-password → create token → Resend email → GET /reset-password?token= → validate → update passwordHash → delete token
```

### Anti-Patterns to Avoid

- **Database sessions with credentials provider:** Auth.js credentials provider requires JWT strategy. Using `strategy: "database"` with credentials causes sessions to not persist. Always set `session: { strategy: "jwt" }` when using credentials.
- **Storing passwordHash via adapter:** The Prisma adapter does not store passwords — do it manually in a Server Action before calling `signIn`. Never store passwords in the Auth.js user model via the adapter flow.
- **Missing `WITH CHECK` on RLS policies:** Every RLS policy needs both `USING` (read) and `WITH CHECK` (write) clauses. Write-only protection is silently missing if you forget `WITH CHECK`.
- **Shareable link tokens as sequential IDs:** Invite tokens must be cryptographically random (nanoid or crypto). Sequential IDs can be enumerated. Generate tokens server-side only.
- **onboarding step data in URL params:** Step data should be persisted to DB after each step (not carried in URL state). If the user closes the browser mid-onboarding, they should resume from the last completed step.
- **Session JWT not including empresaId:** If `empresaId` is not in the JWT callback, every protected page must do an extra DB query to find the tenant. Put `empresaId` and `role` in the JWT at login time.

---

## Prisma Schema — Phase 1 Tables

The following is the recommended schema covering all Phase 1 requirements plus forward-compatibility with Phase 2+ (R2 storage fields, billing quota fields, onboarding state).

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  ENGENHEIRO
  CLIENTE
}

enum ObraTipo {
  RESIDENCIAL
  COMERCIAL
  REFORMA
}

// ---- Auth.js required models (do not rename) ----

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ---- Application models ----

model User {
  id              String    @id @default(cuid())
  name            String?
  email           String    @unique
  emailVerified   DateTime?
  image           String?
  passwordHash    String?
  role            Role      @default(ENGENHEIRO)
  empresaId       String?
  empresa         Empresa?  @relation(fields: [empresaId], references: [id])
  onboardingStep  Int       @default(0) // 0=not started, 1=empresa done, 2=obra done, 3=complete
  accounts        Account[]
  sessions        Session[]
  resetTokens     PasswordResetToken[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Empresa {
  id        String    @id @default(cuid())
  tenantId  String    @unique @default(cuid()) // used for RLS set_config
  nome      String
  cnpj      String?
  logoUrl   String?   // R2 key — null in Phase 1, prepared for Phase 2
  members   User[]
  obras     Obra[]
  statuses  ObraStatus[]
  invites   Invitation[]
  leads     Lead[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Obra {
  id         String     @id @default(cuid())
  tenantId   String     // = empresa.tenantId — RLS uses this
  nome       String
  logradouro String
  numero     String
  cidade     String
  estado     String     @db.Char(2)
  cep        String
  tipo       ObraTipo
  area       Decimal    @db.Decimal(10, 2) // m²
  archived   Boolean    @default(false)
  coverUrl   String?    // R2 key — null in Phase 1
  statusId   String?
  status     ObraStatus? @relation(fields: [statusId], references: [id])
  empresaId  String
  empresa    Empresa    @relation(fields: [empresaId], references: [id])
  members    ObraMember[]
  invitations Invitation[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  @@index([empresaId])
  @@index([tenantId])
}

model ObraStatus {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  color     String   @default("#1A6B5A")
  empresaId String
  empresa   Empresa  @relation(fields: [empresaId], references: [id])
  obras     Obra[]
  @@index([empresaId])
}

model ObraMember {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String
  obraId      String
  role        Role
  // Cliente permissions (Phase 1: stored as JSON, enforced in Phase 2)
  permissions Json?
  obra        Obra     @relation(fields: [obraId], references: [id])
  createdAt   DateTime @default(now())
  @@unique([userId, obraId])
}

model Invitation {
  id        String    @id @default(cuid())
  tenantId  String
  token     String    @unique
  email     String?   // null = shareable link
  role      Role
  obraId    String?
  obra      Obra?     @relation(fields: [obraId], references: [id])
  empresaId String
  empresa   Empresa   @relation(fields: [empresaId], references: [id])
  invitedBy String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([token])
  @@index([email])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

model Lead {
  id        String   @id @default(cuid())
  email     String   @unique
  source    String   @default("landing")
  createdAt DateTime @default(now())
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Google OAuth flow | Custom OAuth token exchange | Auth.js v5 GoogleProvider | PKCE, state parameter, token refresh, account linking — all handled. Missing any of these creates security vulnerabilities. |
| Password reset tokens | Custom UUID in session | `PasswordResetToken` table + `nanoid` | Needs expiry, used-once tracking, and constant-time comparison. Subtle to get right. |
| Session persistence | Cookie management | Auth.js v5 JWT + `auth()` in Server Components | Handles CSRF, httpOnly cookies, signing, expiry, refresh. |
| Email sending | SMTP server | Resend SDK | SPF/DKIM setup, deliverability, bounce handling — solved. |
| Form validation | Manual input checks | Zod + React Hook Form | Handles nested types, error messages, async validation, dirty state tracking. |
| RLS tenant isolation | Manual WHERE on every query | Prisma Client Extension + `set_config` | Application-level guards are forgotten on new routes. RLS is database-enforced. |
| Invite token security | Sequential IDs or timestamps | `nanoid(21)` | Sequential IDs are enumerable; timestamps are predictable. `nanoid(21)` provides ~125 bits of entropy. |

**Key insight:** The auth and invite flows contain the most security-sensitive logic in Phase 1. Every "simple" custom implementation in this area has subtle vulnerabilities. Use battle-tested libraries for the security-critical paths and invest creative effort in the product-specific logic (onboarding UX, obra status customization, dashboard layout).

---

## Common Pitfalls

### Pitfall 1: Credentials Provider + Database Sessions Breaks Session Persistence (AUTH-03)
**What goes wrong:** Setting `session: { strategy: "database" }` with the Credentials provider causes sessions to not persist across refreshes in Auth.js v5. The Prisma adapter is designed for OAuth flows; credentials-based logins require JWT strategy.
**Why it happens:** Developers assume "Prisma adapter = database sessions." But the adapter manages accounts and user records, not session storage when credentials are used.
**How to avoid:** Always set `session: { strategy: "jwt" }`. Store `userId`, `empresaId`, and `role` in the JWT callbacks. Never rely on the default session strategy.
**Warning signs:** Users get logged out on page refresh; `auth()` returns null in Server Components after a credentials login.

### Pitfall 2: Missing RLS `WITH CHECK` Allows Tenant ID Injection (OBRA-01, OBRA-02)
**What goes wrong:** A `USING` clause alone protects reads. Without `WITH CHECK`, a malicious request can `INSERT` a record with another tenant's `tenantId`. Tenant A writes into Tenant B's obra.
**Why it happens:** Tutorials often show only `USING`. The write protection is a separate clause that must be explicit.
**How to avoid:** Every policy must have `WITH CHECK ("tenantId" = current_setting('app.current_tenant_id')::text)`. Write this as a migration linting rule.
**Warning signs:** RLS policies in migrations that lack `WITH CHECK`.

### Pitfall 3: `set_config` Without Transaction Leaks Tenant Context (OBRA-01)
**What goes wrong:** If `set_config('app.current_tenant_id', ..., false)` is used (session-scoped, not transaction-scoped), the tenant ID persists on the pooled connection after the request ends. The next request on that connection inherits the previous request's tenant ID.
**Why it happens:** The boolean third argument `TRUE` = transaction-scoped, `FALSE` = session-scoped. This is non-obvious.
**How to avoid:** Always use `set_config(..., TRUE)` inside a `$transaction`. Never use `FALSE` in a pooled connection environment.
**Warning signs:** `prisma.$executeRaw` calls to `set_config` that are not inside `$transaction`.

### Pitfall 4: Onboarding State in URL Loses Data on Browser Close (AUTH-05)
**What goes wrong:** If Step 1 data (empresa name) is stored in URL query params or React state, closing the browser before completing Step 3 loses everything. The user has to restart. For engineers who are already skeptical of new tools, this creates frustration.
**Why it happens:** Single-page wizard patterns store all state in memory.
**How to avoid:** Persist each step to the database immediately on completion. The `user.onboardingStep` field tracks where they left off. On login, middleware redirects incomplete onboarders back to their last step.
**Warning signs:** Onboarding data held in `useState` or `useReducer` with no DB write until final step.

### Pitfall 5: Shareable Link Tokens That Never Expire (OBRA-02)
**What goes wrong:** A shareable invite link from 2 years ago is still valid. If the link is shared publicly (construction WhatsApp group), anyone who finds it can join the empresa with the assigned role.
**Why it happens:** Developers set `expiresAt` to a far future date for convenience during testing and forget to reset it.
**How to avoid:** Default expiry for shareable links = 30 days. Allow admin to regenerate (which creates a new token, invalidating the old one). Show the expiry date next to the link in the UI.
**Warning signs:** `expiresAt: new Date("2099-01-01")` in seed data or production invite creation code.

### Pitfall 6: Landing Page on Same Domain Shares Auth Cookies with App (MKT-01)
**What goes wrong:** The landing page at `/` and the app at `/app` share the same domain. Auth cookies set for the app are sent on landing page requests, causing unnecessary auth overhead and potential session confusion.
**Why it happens:** Same domain, same cookie scope.
**How to avoid:** Mount the marketing routes under the `(marketing)` route group with no layout auth check. Auth.js middleware should only protect `/dashboard/*` and `/onboarding/*` paths. Landing page has no `auth()` calls. Configure Auth.js `trustHost: true` only when needed.
**Warning signs:** `auth()` being called in the landing page layout component.

### Pitfall 7: Empresa Creation Race Condition on OAuth First Login (AUTH-02)
**What goes wrong:** A new user signs in with Google. Auth.js creates the user record via the adapter. Before the redirect to onboarding completes, a second sign-in attempt (double-click on button) creates a second user record or partial empresa.
**Why it happens:** OAuth callbacks are HTTP redirects; double-submissions are possible.
**How to avoid:** The `onboarding/empresa` step uses `upsert` not `create`. Check `user.empresaId` inside the step before creating. Put the empresa creation in a `try/catch` with a unique constraint on `user.id` in a `empresaMember` table.
**Warning signs:** No `upsert` or idempotency check in the empresa creation Server Action.

---

## Code Examples

### Auth.js v5 Route Handler Setup
```typescript
// apps/web/app/api/auth/[...nextauth]/route.ts
// Source: authjs.dev/getting-started/installation
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

### Protected Server Component
```typescript
// Source: authjs.dev/getting-started/session-management/get-session
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  // session.user.id, session.user.empresaId, session.user.role are available
}
```

### Middleware Auth Guard
```typescript
// apps/web/middleware.ts
// Source: authjs.dev/getting-started/session-management/protecting
import { auth } from "@/lib/auth"
export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard")
  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }
})
export const config = { matcher: ["/dashboard/:path*", "/onboarding/:path*"] }
```

### Resend Invite Email
```typescript
// Source: resend.com/docs/send-with-nextjs
import { Resend } from "resend"
import { InviteEmail } from "@projetapro/emails"

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: "ProjetaPro <noreply@projetapro.com.br>",
  to: targetEmail,
  subject: `Voce foi convidado para ${obraName}`,
  react: InviteEmail({ inviterName, obraName, acceptUrl: `https://projetapro.com.br/invite/${token}` }),
})
```

### shadcn/ui Component Install
```bash
# Source: ui.shadcn.com/docs/installation/next
npx shadcn@latest add button input form card dialog table tabs badge avatar
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-auth v4 (App Router issues) | Auth.js v5 (rewrite for App Router) | 2024 stable release | v4 had middleware auth issues in App Router; v5 is the supported path |
| `tailwind.config.js` with CSS vars | TailwindCSS v4 CSS-first config | 2025 | No JS config file; shadcn supports v4 as of 2025 |
| Manual bcrypt in API routes | bcrypt in Server Actions (server-only) | N/A — pattern stays | "use server" functions run only server-side; no leaking of bcrypt to client bundle |
| pnpm + Lerna monorepo | pnpm workspaces + Turborepo | 2023–2024 maturity | Lerna deprecated for non-versioning use cases; Turborepo is the standard |
| Prisma `$executeRaw` for RLS | Prisma Client Extensions with `$transaction` | Prisma 4.16+ extensions stable | Extensions provide a cleaner, type-safe wrapper for RLS per-request |

**Deprecated/outdated:**
- `next-auth@4`: Do not install; conflicts with App Router. Install `next-auth@5`.
- `@next-auth/prisma-adapter`: Replaced by `@auth/prisma-adapter`. The package name changed in Auth.js v5.
- TailwindCSS v3 config patterns: shadcn now targets TailwindCSS v4 (CSS config, not `tailwind.config.js`).

---

## Open Questions

1. **Auth.js v5 stable vs beta tag**
   - What we know: Auth.js v5 was in beta for an extended period; as of late 2024 it is stable for Next.js 15
   - What's unclear: Whether the npm tag `next-auth@5` or `next-auth@beta` is the install target as of March 2026
   - Recommendation: At project start, run `npm info next-auth` and confirm latest stable is v5.x; install by explicit version, not tag

2. **TailwindCSS v4 + shadcn compatibility in monorepo**
   - What we know: shadcn supports Tailwind v4 as of early 2025
   - What's unclear: Whether `npx shadcn init` correctly detects Tailwind v4 CSS config in a pnpm monorepo workspace
   - Recommendation: Run `shadcn init` inside `apps/web` first; verify generated `components.json` references correct paths; test one component add before proceeding

3. **Prisma Client Extension + connection pooler (future Railway setup)**
   - What we know: `set_config(..., TRUE)` is transaction-scoped and safe for poolers
   - What's unclear: Railway's PostgreSQL provides PgBouncer; confirm it runs in Session mode, not Transaction mode for Phase 1
   - Recommendation: Deploy with Railway's direct connection URL (no pooler) in Phase 1; add `?pgbouncer=true&connection_limit=1` and switch to session pooling before Phase 2 load testing

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 1.x |
| Config file | `vitest.config.ts` at monorepo root (Wave 0 gap) |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User sign up with email/password | integration | `vitest run tests/auth/register.test.ts` | Wave 0 |
| AUTH-02 | Google OAuth redirect and callback | smoke | Manual verify (OAuth requires browser flow) | manual-only |
| AUTH-03 | Session persists across refresh | integration | `vitest run tests/auth/session.test.ts` | Wave 0 |
| AUTH-04 | Password reset link is valid + expires | unit | `vitest run tests/auth/password-reset.test.ts` | Wave 0 |
| AUTH-05 | 3-step onboarding completes empresa+obra | integration | `vitest run tests/onboarding/wizard.test.ts` | Wave 0 |
| OBRA-01 | Create, edit, archive obra | integration | `vitest run tests/obra/crud.test.ts` | Wave 0 |
| OBRA-01 | Cross-tenant isolation (RLS) | integration | `vitest run tests/security/rls-isolation.test.ts` | Wave 0 — CRITICAL |
| OBRA-02 | Invite by email: token created + email queued | integration | `vitest run tests/invite/email-invite.test.ts` | Wave 0 |
| OBRA-02 | Shareable link: anyone with token can join | integration | `vitest run tests/invite/link-invite.test.ts` | Wave 0 |
| OBRA-02 | Expired invite rejected | unit | `vitest run tests/invite/expiry.test.ts` | Wave 0 |
| OBRA-03 | Obra fields validated (area > 0, CEP format) | unit | `vitest run tests/obra/validation.test.ts` | Wave 0 |
| MKT-01 | Lead capture stores email + sends confirmation | integration | `vitest run tests/marketing/lead-capture.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/security/rls-isolation.test.ts` (RLS test always runs)
- **Per wave merge:** `pnpm vitest run --coverage`
- **Phase gate:** Full suite green + RLS isolation test green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/db/vitest.config.ts` — Vitest config with test database URL
- [ ] `tests/setup.ts` — shared test DB setup (create two test tenants, seed basic data, teardown)
- [ ] `tests/security/rls-isolation.test.ts` — CRITICAL: two-tenant isolation test (insert as tenant A, query as tenant B, assert 0 rows)
- [ ] `tests/auth/register.test.ts` — credentials registration flow
- [ ] `tests/auth/session.test.ts` — JWT session persistence
- [ ] `tests/auth/password-reset.test.ts` — token creation, expiry, single-use
- [ ] `tests/onboarding/wizard.test.ts` — Server Action integration for 3 steps
- [ ] `tests/obra/crud.test.ts` — create, edit, archive, list filtered by tenant
- [ ] `tests/invite/email-invite.test.ts` — invite creation + Resend mock
- [ ] `tests/invite/link-invite.test.ts` — shareable link accept flow
- [ ] `tests/invite/expiry.test.ts` — expired and used token rejection
- [ ] `tests/obra/validation.test.ts` — Zod schema unit tests
- [ ] `tests/marketing/lead-capture.test.ts` — lead upsert + duplicate email handling
- [ ] Framework install: `pnpm add -D vitest @vitest/coverage-v8` in `packages/db`

---

## Sources

### Primary (HIGH confidence)
- authjs.dev/getting-started — Auth.js v5 setup, Prisma adapter, credentials provider, JWT strategy
- authjs.dev/getting-started/adapters/prisma — Prisma adapter schema requirements
- prisma.io/docs/guides/authjs-nextjs — Official Prisma + Auth.js integration guide
- ui.shadcn.com/docs/installation/next — shadcn/ui Next.js 15 installation
- resend.com/docs/send-with-nextjs — Resend + Next.js Server Actions
- aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security — RLS patterns (AWS official)
- .planning/research/STACK.md — prior project stack research
- .planning/research/ARCHITECTURE.md — prior project architecture research
- .planning/research/PITFALLS.md — prior project pitfalls research

### Secondary (MEDIUM confidence)
- noqta.tn/en/tutorials/nextjs-authjs-v5-authentication-guide-2026 — Auth.js v5 Phase 1 walkthrough (verified against official docs)
- atlasgo.io/guides/orms/prisma/row-level-security — Prisma Client Extension + RLS pattern (verified against Prisma docs)
- medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm — Prisma multi-tenant RLS (cross-verified with AWS guide)
- medium.com/@TheblogStacker/2025-monorepo-that-actually-scales-turborepo-pnpm-for-next-js — Turborepo + pnpm workspaces patterns

### Tertiary (LOW confidence)
- Specific nanoid token length recommendations — based on standard practice, not a single authoritative source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core libraries verified against official docs; versions confirmed
- Architecture: HIGH — patterns derived from official Auth.js, Prisma, and prior project research
- Prisma schema: HIGH — schema follows Auth.js required models exactly + standard multi-tenant patterns
- RLS patterns: HIGH — verified against AWS official guide + Prisma documentation
- Pitfalls: HIGH — Auth.js credentials pitfall from official docs; RLS pitfalls from security research in PITFALLS.md
- Test map: MEDIUM — test file paths are recommendations, not existing files; Wave 0 must create them

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (90 days — stable libraries; re-verify Auth.js v5 stable/beta tag at project start)
