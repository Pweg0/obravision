# Phase 3: Cronograma + RDO - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Gerenciamento de cronograma de obra com Gantt interativo, alertas automaticos de clima para tarefas sensiveis, e diario de obra (RDO) vinculado ao cronograma com fotos e clima do dia. O sistema calcula progresso real vs planejado cruzando entradas de diario com o cronograma. Cria um ciclo fechado entre planejamento no escritorio e execucao em campo.

</domain>

<decisions>
## Implementation Decisions

### Gantt Interativo
- Hierarquia de 2 niveis: Etapas (Fundacao, Alvenaria, Acabamento) > Tarefas. Etapas sao barras resumo no Gantt
- Interatividade: drag basico para mover datas das barras + formulario/modal para editar detalhes e dependencias
- Sem dependencias entre tarefas no v1 — tarefas sao independentes, sem setas de ligacao
- Status fixos padrao: Pendente, Em andamento, Concluida, Atrasada
- Permissoes: Admin + Engenheiro gerenciam cronograma, Cliente visualiza

### Diario de Obra (RDO)
- Permissao: somente Engenheiro + Admin criam entradas no diario. Cliente visualiza
- Formato template adaptavel: texto livre + fotos como base, com campos opcionais expandiveis (mao de obra, materiais, ocorrencias). Usuario preenche so o que quiser
- Vinculo ao cronograma: sistema auto-detecta tarefa ativa baseado na data e status (Em andamento), campo pre-preenchido mas editavel pelo usuario
- Fotos com legenda: upload multiplo para R2, cada foto pode ter legenda/descricao opcional (ex: "Armacao do pilar 3")

### Alertas de Clima
- Dupla antecedencia: alerta preliminar 3 dias antes ("possibilidade de chuva") + alerta confirmado 1 dia antes ("chuva confirmada")
- Marcacao de tarefas sensiveis: etapa define o default (ex: Fundacao = sensivel por default), cada tarefa pode sobrescrever individualmente via toggle
- Visual: icone de chuva aparece diretamente na barra da tarefa no Gantt + notificacao padrao (toast + badge + som do sistema existente Phase 2)
- Clima no RDO: sistema pre-preenche automaticamente o clima do dia (via API de clima), mas usuario pode corrigir manualmente se previsao estiver errada

### Progresso Real vs Planejado
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

</decisions>

<specifics>
## Specific Ideas

- Barra dupla no Gantt (planejado vs real) para visualizar progresso de cada tarefa
- Badge de atraso ("-3d") nas barras do Gantt para quantificar o desvio
- Etapas definem sensibilidade ao clima por default, mas tarefas podem sobrescrever — flexibilidade sem atrito
- Template adaptavel no RDO: rapido para preencher em campo (so texto + foto), mas com opcao de ser detalhado quando necessario
- Fotos com legenda para contexto — engenheiro ve a foto e sabe exatamente o que esta olhando

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- BullMQ queue/worker pattern (Phase 2) — reutilizar para cron jobs de clima
- Socket.io + NotificationBell + toast system (Phase 2) — alertas de clima usam o mesmo canal
- R2 upload pipeline com presigned URLs (Phase 2) — reutilizar para fotos do RDO
- Server actions pattern com `getTenantContext()` + Zod validation (Phase 1)
- Dashboard layout com widgets placeholder (Phase 1) — widget de progresso se integra aqui
- Prisma + RLS multi-tenancy (Phase 1) — novos modelos seguem mesmo padrao

### Established Patterns
- Server Actions + Zod + revalidatePath para mutacoes
- Client Components com useFormStatus + useState para forms
- emitNotification para eventos em tempo real
- Tailwind CSS + shadcn/ui + verde-obra #1A6B5A

### Integration Points
- Obra detail page (`/dashboard/obras/[id]`) — cronograma e RDO se integram como abas/secoes
- Dashboard widgets — widget de curva S de progresso
- Notification system — alertas de clima geram notificacoes
- R2 bucket — fotos do RDO usam mesmo bucket das plantas
- Fastify API (`apps/api`) — cron job de clima como BullMQ repeatable job

</code_context>

<deferred>
## Deferred Ideas

- Dependencias entre tarefas (FS/FF/SS/SF) — v2, quando validar que usuarios precisam
- Caminho critico no Gantt — v2, requer dependencias
- Exportar Gantt em PDF/Excel — v2 (Phase 5 relatorios)
- Status customizaveis de tarefa — v2, manter simples com fixos no v1
- 3 niveis de hierarquia (Etapas > Sub-etapas > Tarefas) — v2 se necessario

</deferred>

---

*Phase: 03-cronograma-rdo*
*Context gathered: 2026-03-13*
