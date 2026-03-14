# ProjetaPro

## What This Is

ProjetaPro e um SaaS de gestao de obras para a construcao civil brasileira, focado em colaboracao visual sobre projetos. Engenheiros, clientes e equipes de campo compartilham o mesmo documento de obra e se comunicam diretamente sobre cada elemento do projeto — com pins ancorados em plantas, cronograma Gantt, e diario de obra. Elimina prints de WhatsApp, PDFs renomeados e reunioes desnecessarias. O produto atende construtoras medias, incorporadoras regionais e engenheiros autonomos.

## Core Value

Comentarios ancorados diretamente em elementos do projeto (parede, viga, escada) com versionamento de plantas e integracao campo-escritorio — tudo em uma unica plataforma visual.

## Requirements

### Validated

- ✓ Autenticacao com email/senha e Google OAuth — v1.0
- ✓ CRUD de obras com convite de membros e roles — v1.0
- ✓ Onboarding de 3 passos (empresa > obra > equipe) — v1.0
- ✓ Landing page publica com captura de leads — v1.0
- ✓ Upload e versionamento de plantas PDF (R0, R1, R2...) — v1.0
- ✓ Viewer de planta com PDF.js e navegacao/zoom — v1.0
- ✓ Comentarios ancorados em elementos do projeto com pins e threads — v1.0
- ✓ Notificacoes em tempo real via WebSocket — v1.0
- ✓ Cronograma Gantt com alerta de clima integrado — v1.0
- ✓ Cronograma basico de tarefas com status e responsaveis — v1.0
- ✓ Diario de obra integrado ao cronograma com fotos e clima — v1.0

### Active

- [ ] Orcamento com codigos SINAPI e BDI
- [ ] Proposta comercial e Curva ABC de insumos
- [ ] Compras com workflow de aprovacao e mapa comparativo
- [ ] Estoque por obra com multiplos depositos
- [ ] Medicoes fisicas e de contrato com empreiteiros
- [ ] Relatorio gerencial integrado (evolucao, custos, pagamentos)
- [ ] Dashboard KPI por obra
- [ ] Exportacao de relatorio em PDF

### Out of Scope

- Chat em tempo real entre usuarios — complexidade alta, WhatsApp ja cumpre esse papel
- Video posts/streaming de obra — custo de storage/bandwidth desproporcional ao valor
- App desktop nativo — web-first e suficiente para o publico-alvo
- Reproducao de texto de normas NBR — copyright ABNT impede, usar checklists parametrizados
- App mobile (login, diario, camera, offline) — deferred to v2
- Billing com Stripe — deferred until product-market fit validated
- Checagem NBR assistida por IA — deferred to v2
- Multi-empresa, SSO, API publica — enterprise features deferred to v2

## Context

- Fundador e dev solo, com 2 engenheiros amigos como beta testers em obras reais
- Mercado brasileiro de construcao civil, engenheiros conservadores com resistencia a novo software
- Concorrentes diretos: Mais Controle, Obra Prima, Sienge — nenhum oferece colaboracao visual sobre plantas
- v1.0 MVP shipped 2026-03-14 com 15,430 LOC TypeScript
- Stack: Next.js 15 + Fastify 5 + PostgreSQL + Prisma + Cloudflare R2 + Socket.io + BullMQ
- Deploy: Railway (web + API + PostgreSQL + Redis)
- Modelo de precos (Free/Pro R$149/Business R$349) sao hipoteses para validar com o mercado
- Cobranca por obra ativa (nao por usuario) — mais intuitivo para o mercado-alvo

## Constraints

- **Solo dev**: Um desenvolvedor construindo tudo — priorizar simplicidade e ferramentas com boa DX
- **Budget**: Infraestrutura precisa comecar barata (Railway/R2 free tiers)
- **Legal**: Nao reproduzir texto de normas NBR (copyright ABNT) — checklists parametrizados apenas
- **Mercado**: Onboarding precisa ser < 5 min — engenheiros nao tem paciencia para setup complexo

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cobranca por obra ativa, nao por usuario | Mais intuitivo para construtoras, incentiva uso amplo | -- Pending |
| Monorepo com pnpm workspaces | Compartilhar tipos e logica entre web/api | ✓ Good |
| Next.js 15 + Fastify 5 + PostgreSQL | Full-stack TS, server actions, API separada para workers | ✓ Good |
| PostgreSQL RLS multi-tenancy | Single schema, tenant isolation sem complexity | ✓ Good |
| Cloudflare R2 para storage | Zero egress fees, decisivo para produto PDF-heavy | ✓ Good |
| Auth.js v5 com JWT strategy | Mandatory para Credentials provider, funciona com RLS | ✓ Good |
| Socket.io para real-time | Maduro, funciona com Fastify plugin, room-per-obra | ✓ Good |
| @svar-ui/react-gantt | Unico Gantt React com licença MIT e features suficientes | ⚠️ Revisit (pnpm issues) |
| BullMQ para background jobs | Weather cron, PDF conversion, reliable queues | ✓ Good |
| CSS percentage positioning para pins | Zoom/resize invariant, zero JS recalc | ✓ Good |
| Railway para deploy | Simples, PostgreSQL + Redis managed, bom DX | ✓ Good |

---
*Last updated: 2026-03-14 after v1.0 milestone*
