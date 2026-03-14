# Phase 1: Foundation - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth (email/senha + Google OAuth), obra CRUD with roles and invites, 3-step onboarding wizard, dashboard with obra listing, and public landing page with lead capture. This is the system existing — users can sign up, create obras, invite teams, and start using the product in under 5 minutes.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Flow
- 3 steps: criar empresa > criar obra > convidar equipe
- Step 1 (empresa): apenas nome obrigatorio — CNPJ, endereco, logo podem ser adicionados depois
- Step 2 (obra): nome + endereco + tipo (residencial/comercial/reforma) + area obrigatorios
- Step 3 (equipe): pulavel com botao "pular" — convite pode ser feito depois pela tela da obra
- Convite por 2 metodos: email direto (digitar email + role) E link compartilhavel (para equipe de campo)

### Obra Management
- Listagem com toggle entre cards (com foto de capa, badge status, progresso) e tabela/lista
- Status customizaveis: usuario cria seus proprios status (sem lista fixa)
- Arquivamento: obra sai da listagem principal, vai para aba "Arquivadas" separada
- Dados basicos apenas no v1: nome, endereco, tipo, area — sem metragem extra, valor ou alvara

### Dashboard
- Dashboard completo com estrutura visual para todos os widgets desde o Phase 1
- Lista de obras e atividade recente funcionais no Phase 1
- Widgets de alertas de clima e comentarios pendentes como placeholders — ganham dados quando Phases 2 e 3 estiverem prontas

### Landing Page
- Referencia visual: Mais Controle (maiscontroleerp.com.br) — mas melhor executado
- Secoes: Hero com CTA + secao de features do produto
- Sem pricing, sem social proof no v1 — produto e para beta testers
- Formulario de captura: apenas campo de email + botao "Quero testar"
- Mesmo dominio: projetapro.com.br/ e landing, /app e area logada

### Roles & Permissions
- 3 roles: Admin, Engenheiro, Cliente
- Admin: acesso total — gerencia empresa, membros, billing, tudo
- Multiplos admins por empresa (sem conceito de "owner" separado)
- Engenheiro: edita tudo da obra (dados, tarefas, diario) — nao gerencia membros nem billing
- Cliente: permissoes customizaveis — admin define o que cada cliente pode ver por obra
- Convites: admin e engenheiro podem convidar membros

### Claude's Discretion
- Filtros da listagem de obras (Claude escolhe os mais uteis)
- Design exato dos cards e tabela de obras
- Loading states e skeletons
- Layout exato do dashboard e widgets
- Paleta de cores e tipografia seguem o design system do documento (Verde Obra #1A6B5A, Inter font)
- Error states e validacoes de formulario

</decisions>

<specifics>
## Specific Ideas

- Referencia visual da landing page: Mais Controle (maiscontroleerp.com.br) — tom profissional de construcao civil, mas com execucao visual moderna
- Onboarding precisa ser < 5 min — engenheiros conservadores nao toleram setup complexo
- Status customizaveis porque cada construtora tem seu proprio vocabulario de fases/status
- Convite por link compartilhavel e essencial para equipes de campo que nao checam email

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Nenhum — projeto greenfield, sem codigo existente

### Established Patterns
- Stack decidida pela pesquisa: Next.js 15 (App Router), Fastify 5, PostgreSQL 16 + RLS, Prisma 5, Auth.js v5
- Design system do documento: Inter font, Verde Obra #1A6B5A, shadcn/ui components
- Monorepo pnpm workspaces

### Integration Points
- Auth.js v5 para autenticacao (email/senha + Google OAuth)
- PostgreSQL RLS para multi-tenancy desde o inicio
- Cloudflare R2 para storage futuro (nao usado no Phase 1, mas schema deve prever)
- Resend.com para emails transacionais (convites, reset senha)

</code_context>

<deferred>
## Deferred Ideas

- Pricing table na landing page — Phase 2 (billing)
- Social proof/depoimentos — depois de ter beta testers
- Dashboard widgets com dados reais de clima e comentarios — Phases 2 e 3
- Notificacoes in-app — Phase 2 (WebSocket)

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-13*
