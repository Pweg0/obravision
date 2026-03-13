# ObraVision

## What This Is

ObraVision e um SaaS de gestao de obras para a construcao civil brasileira, focado em colaboracao visual sobre projetos. Engenheiros, clientes e equipes de campo compartilham o mesmo documento de obra e se comunicam diretamente sobre cada elemento do projeto — eliminando prints de WhatsApp, PDFs renomeados e reunioes desnecessarias. O produto atende construtoras medias, incorporadoras regionais e engenheiros autonomos.

## Core Value

Comentarios ancorados diretamente em elementos do projeto (parede, viga, escada) com versionamento de plantas e integracao campo-escritorio — tudo em uma unica plataforma visual.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

- [ ] Autenticacao com email/senha e Google OAuth
- [ ] CRUD de obras com convite de membros e roles
- [ ] Upload e versionamento de plantas PDF (R0, R1, R2...)
- [ ] Viewer de planta com PDF.js e navegacao/zoom
- [ ] Cronograma basico de tarefas com status e responsaveis
- [ ] Diario de obra integrado ao cronograma com fotos e clima
- [ ] Onboarding de 3 passos (empresa > obra > equipe)
- [ ] App mobile basico (login, diario, camera)
- [ ] Comentarios ancorados em elementos do projeto com pins e threads
- [ ] Notificacoes em tempo real via WebSocket
- [ ] Cronograma Gantt com alerta de clima integrado
- [ ] Billing com Stripe (Free/Pro/Business) e trial 14 dias
- [ ] Checagem NBR assistida por IA (Claude API)
- [ ] Relatorio de conformidade com itens OK/Atencao/Nao Conforme
- [ ] Gantt com dependencias e caminho critico
- [ ] Relatorio de obra exportavel em PDF
- [ ] Portal do cliente (link externo read-only)
- [ ] Modo offline no app mobile com sync
- [ ] Multi-empresa (multiplos CNPJs)
- [ ] Controle financeiro basico (orcamento previsto vs realizado)
- [ ] Gestao de contratos com prestadores
- [ ] API publica para integracao com ERPs
- [ ] SSO (Google Workspace, Azure AD)
- [ ] Landing page publica com captura de leads
- [ ] Templates de obras pre-montados por tipo
- [ ] Programa de indicacao

### Out of Scope

- Chat em tempo real entre usuarios — complexidade alta, WhatsApp ja cumpre esse papel
- Video posts/streaming de obra — custo de storage/bandwidth desproporcional ao valor
- App desktop nativo — web-first e suficiente para o publico-alvo
- Reproducao de texto de normas NBR — copyright ABNT impede, usar checklists parametrizados

## Context

- Fundador e dev solo, com 2 engenheiros amigos como beta testers em obras reais
- Mercado brasileiro de construcao civil, engenheiros conservadores com resistencia a novo software
- Concorrentes diretos: Mais Controle, Obra Prima, Sienge — nenhum oferece colaboracao visual sobre plantas
- Stack tecnica aberta a sugestoes (documento propoe Next.js/Fastify/PostgreSQL mas nao e definitivo)
- Modelo de precos (Free/Pro R$149/Business R$349) sao hipoteses para validar com o mercado
- Cobranca por obra ativa (nao por usuario) — mais intuitivo para o mercado-alvo
- Projeto dividido em 4 fases ao longo de ~18 meses (MVP > Diferencial > IA/Escala > Enterprise)
- Risco identificado: PDFs grandes (>50MB) podem ser lentos — mitigacao com conversao server-side
- Risco identificado: custo Claude API em escala — mitigacao com limites por plano e cache

## Constraints

- **Solo dev**: Um desenvolvedor construindo tudo — priorizar simplicidade e ferramentas com boa DX
- **Budget**: Infraestrutura precisa comecar barata (Railway/Vercel/R2 free tiers)
- **Legal**: Nao reproduzir texto de normas NBR (copyright ABNT) — checklists parametrizados apenas
- **Mercado**: Onboarding precisa ser < 5 min — engenheiros nao tem paciencia para setup complexo
- **Mobile**: App precisa funcionar offline em canteiro de obras (conectividade ruim)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cobranca por obra ativa, nao por usuario | Mais intuitivo para construtoras, incentiva uso amplo | -- Pending |
| Monorepo com pnpm workspaces | Compartilhar tipos e logica entre web/mobile/backend | -- Pending |
| Stack aberta a pesquisa | Documento propoe Next.js/Fastify/PG mas aceita alternativas melhores | -- Pending |
| Aviso legal permanente na checagem NBR | Proteger contra responsabilidade — analise e assistiva, nao substitui laudo | -- Pending |

---
*Last updated: 2026-03-13 after initialization*
