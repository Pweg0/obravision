# Phase 4: Orcamento + Compras + Medicoes - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Engineers can build a complete obra budget with SINAPI codes and BDI, manage procurement from purchase request through supplier quotes to purchase order, track inventory across multiple storage locations per obra, and record physical progress measurements and subcontractor contract measurements. Creates a closed loop between budget planning, material procurement, inventory control, and progress tracking.

</domain>

<decisions>
## Implementation Decisions

### Estrutura do Orcamento
- Entrada de dados: manual (busca SINAPI + adiciona itens) E importacao de planilha Excel/CSV
- Hierarquia de 2 niveis: Etapa (Fundacao, Alvenaria...) > Item de orcamento
- BDI global por obra — um percentual unico aplicado sobre o custo total
- Duas visoes: Custo (quanto custa construir) e Venda (com BDI aplicado, quanto cobrar do cliente)
- Curva ABC de insumos e proposta comercial exportavel (Plan 04-02 no roadmap)

### Fluxo de Compras
- Workflow de 3 etapas: Requisicao > Cotacao > Pedido de Compra
- Fornecedores cadastrados por empresa (nao por obra) — reutilizaveis entre obras. Dados: nome, CNPJ, contato, categorias
- Aprovacao: Admin E Engenheiro podem aprovar requisicoes
- Mapa comparativo: tabela lado a lado (itens nas linhas, fornecedores nas colunas, destaque no menor preco por item)
- Requisicao vinculada ao item do orcamento — sistema sabe quanto ja foi comprado vs orcado
- Notificacoes de aprovacao via sistema in-app existente (toast + badge + sino)
- Pedido de compra gera PDF exportavel para enviar ao fornecedor
- Ao marcar pedido como "Entregue", sistema cria entrada automatica no estoque

### Controle de Estoque
- Multiplos depositos por obra (almoxarifado central, canteiro, deposito externo)
- 3 tipos de movimentacao: Entrada (compra/devolucao), Saida (uso na obra/perda), Transferencia (entre depositos)
- Alerta de estoque baixo com minimo configuravel por material — notificacao in-app quando cai abaixo
- Saida de material com campo opcional de tarefa/etapa destino — permite rastrear custo por atividade
- Permissoes: Admin + Engenheiro gerenciam estoque, Cliente visualiza

### Medicoes Fisicas e de Contrato
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

</decisions>

<specifics>
## Specific Ideas

- Requisicao de compra vinculada ao orcamento permite controle real de gasto vs previsto — diferencial vs concorrentes que separam orcamento de compras
- Entrada automatica no estoque ao receber pedido elimina trabalho manual duplicado
- Mapa comparativo lado a lado com destaque no menor preco e uma referencia visual clara (estilo planilha Excel de comparacao que engenheiros ja usam)
- Saida de material com vinculo opcional a tarefa permite analise de custo por atividade sem forcar o usuario a classificar tudo

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Server actions pattern com `getTenantContext()` + Zod validation + `revalidatePath()` — reutilizar para todas as acoes de orcamento/compras/estoque
- BullMQ queue/worker pattern — reutilizar para geracao de PDF de pedido de compra e boletim de medicao
- R2 upload pipeline com presigned URLs — reutilizar para storage de PDFs gerados
- Socket.io + NotificationBell + toast system — alertas de aprovacao e estoque baixo
- ObraTable + ObraCard patterns — base para tabelas de orcamento, compras, estoque
- EtapaForm modal pattern — base para formularios modais de itens de orcamento, cotacoes
- Button, Card, Input, Label (shadcn/ui) — componentes base
- StatusBadge — referencia para badges de status de requisicao/pedido

### Established Patterns
- Server Actions + Zod + revalidatePath para mutacoes
- RLS via `createTenantClient(tenantId)` — novos modelos seguem mesmo padrao
- Client Components com useFormStatus + useState para forms
- Tailwind CSS + shadcn/ui + DM Sans font + tema premium (dark/light mode)
- Hierarquia Etapa > Tarefa no cronograma alinha com Etapa > Item no orcamento

### Integration Points
- Prisma schema — adicionar modelos Orcamento, OrcamentoItem, Fornecedor, CompraRequisicao, CompraCotacao, CompraPedido, Deposito, MovimentacaoEstoque, MedicaoFisica, MedicaoContrato
- Obra detail page (`/dashboard/obras/[id]`) — novas abas/secoes para orcamento, compras, estoque, medicoes
- Dashboard widgets — novos widgets para orcamento vs real, compras pendentes, alertas de estoque
- Notification system — aprovacoes pendentes e alertas de estoque baixo
- Fastify API — rotas para geracao de PDF (BullMQ worker)
- R2 bucket — storage dos PDFs gerados (pedido de compra, boletim de medicao)

</code_context>

<deferred>
## Deferred Ideas

- Integracao com ERP externo (Sienge, UAU) — v2
- Nota fiscal eletronica (NF-e) vinculada ao pedido de compra — v2
- App mobile para conferencia de estoque em campo — v2
- Fluxo de devolucao para fornecedor — v2
- Multiplas moedas / cotacao em dolar — v2

</deferred>

---

*Phase: 04-orcamento-compras-medicoes*
*Context gathered: 2026-03-14*
