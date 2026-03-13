# Phase 2: PDF Viewer + Anchored Comments - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Upload de plantas PDF por obra, visualizacao em viewer embutido com zoom e navegacao, versionamento de revisoes (R0, R1, R2...), comentarios ancorados com pins e threads, e notificacoes em tempo real via WebSocket. Plantas sao agrupadas por tipo/disciplina na pagina da obra.

</domain>

<decisions>
## Implementation Decisions

### Experiencia do Viewer
- Viewer embutido na pagina da obra (painel grande), nao tela cheia — sidebar/nav da obra continua visivel
- Toolbar horizontal no topo do viewer com zoom, navegacao de paginas e acoes
- Navegacao por pagina unica com setas prev/next e seletor de pagina na toolbar (sem scroll continuo)
- Abordagem tecnica para PDFs grandes (>50MB) a criterio do Claude — o importante e que funcione rapido

### Pin & Interacao de Comentarios
- Fluxo de criacao: clique coloca pin temporario, popup pergunta "Adicionar comentario aqui?" com campo de texto, cancelar remove o pin
- Threads aparecem em sidebar direita (estilo Figma) — viewer encolhe para dar espaco
- Sidebar escondida por default — so aparece quando um pin e selecionado
- Pins identificados visualmente pelo avatar/inicial do autor (nao numeros ou cores)
- Sem status aberto/resolvido no v1 — todos os pins sao iguais
- Soft delete para pins e comentarios — mostra "removido" mas historico fica no banco
- Permissoes: Admin + Engenheiro criam pins e comentam. Cliente somente visualiza (read-only)

### Gestao de Revisoes
- Navegacao entre revisoes via dropdown na toolbar: "R2 (atual) ▾"
- Ao fazer upload de nova revisao, pergunta "Migrar pins da revisao anterior?" — Sim copia os pins, Nao comeca limpo
- Campo de changelog obrigatorio ao enviar nova revisao (ex: "Alteracao na fundacao do bloco B")
- Permissao de upload: Admin + Engenheiro
- Admin pode deletar planta inteira ou revisao especifica (soft delete com lixeira, restauravel em 30 dias)

### Organizacao de Plantas na Obra
- Plantas agrupadas por tipo/disciplina na pagina da obra
- Tipos pre-definidos por default (Arquitetura, Estrutural, Eletrica, Hidraulica, Incendio, Topografia) + opcao de criar tipos customizados
- Dentro de cada grupo, lista de plantas com suas revisoes

### Notificacoes em Tempo Real
- Toast popup + badge numerico no sino da navbar + som discreto de notificacao
- Sem live pins — usuario recebe notificacao e precisa dar refresh/clicar para ver pins novos na planta
- Central de notificacoes: dropdown no sino mostra 5 mais recentes + link "Ver todas" para pagina dedicada
- Eventos que geram notificacao: novo pin, nova resposta em thread que participo, nova revisao de planta, mencao @usuario em comentario
- Sistema de mencao @usuario em comentarios com notificacao direcionada

### Claude's Discretion
- Abordagem tecnica para renderizacao de PDFs grandes (PDF.js direto vs conversao server-side vs hibrido)
- Design exato dos componentes (pins, sidebar, toolbar, dropdown de revisoes)
- Loading states e skeletons
- Estrategia de cache e performance para PDFs
- Layout exato da pagina de notificacoes dedicada
- Animacao/transicao do toast de notificacao
- Formato do som de notificacao

</decisions>

<specifics>
## Specific Ideas

- Sidebar de comentarios estilo Figma — limpa, aparece so quando necessario
- Pins com avatar/inicial do autor para identificacao rapida de quem comentou
- Dropdown de revisoes com badge "atual" na mais recente
- Mencoes @usuario nos comentarios para notificacao direcionada
- Changelog obrigatorio nas revisoes para rastreabilidade — engenheiros precisam saber o que mudou em cada versao

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Button, Card, Input, Label (shadcn/ui) — base para novos componentes
- ObraForm pattern — server action + FormData + Zod validation, reutilizar para PlantaUpload
- StatusBadge — referencia para criar componentes de badge (revisao badge, pin count)
- DashboardLayout — sidebar nav e mobile header ja prontos, viewer embutido se integra
- `cn()` utility — class-variance-authority + tailwind-merge para variantes

### Established Patterns
- Server Actions com `getTenantContext()` + Zod validation + `revalidatePath()`
- RLS via `createTenantClient(tenantId)` — novos modelos (Planta, Pin, Thread) seguem mesmo padrao
- Client Components com `useFormStatus()` + `useState` para erro
- Sem Redux/Zustand — server state + React Server Components
- Tailwind CSS 3 + dark mode via next-themes + verde-obra #1A6B5A

### Integration Points
- Obra detail page (`/dashboard/obras/[id]`) — viewer de plantas se integra aqui
- Prisma schema (`packages/db/prisma/schema.prisma`) — novos modelos Planta, Pin, Thread, Message
- Fastify API (`apps/api`) — scaffold pronto para BullMQ workers e Socket.io
- Middleware (`apps/web/middleware.ts`) — rotas do viewer ja sao protegidas pelo auth existente
- `coverUrl` e `logoUrl` ja existem no schema — padrao para R2 keys
- Dashboard widgets placeholder para "comentarios pendentes" — ganha dados reais nesta fase

</code_context>

<deferred>
## Deferred Ideas

- Notificacao via email quando alguem comenta na planta — v2
- Notificacao via WhatsApp — v2
- Live pins em tempo real no viewer (estilo Figma) — v2, por enquanto so notificacao + refresh
- Status aberto/resolvido em pins — v2 quando validar que usuarios precisam
- Comparacao side-by-side entre revisoes — v2

</deferred>

---

*Phase: 02-pdf-viewer-anchored-comments*
*Context gathered: 2026-03-13*
