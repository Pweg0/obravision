import { notFound } from "next/navigation"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { ObraDashboardClient } from "./ObraDashboardClient"

export default async function ObraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.empresaId) {
    notFound()
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) notFound()

  const tenantClient = createTenantClient(empresa.tenantId)

  const obra = await tenantClient.obra.findUnique({
    where: { id },
    include: {
      status: true,
      members: true,
    },
  })

  if (!obra) notFound()

  const [
    plantaCount,
    etapaCount,
    rdoCount,
    orcamento,
    medicaoCount,
    recentPlantas,
    recentRdos,
    recentTarefas,
    tarefasProgress,
    // Purchase data for charts
    requisicoes,
    pedidos,
    cotacaoCount,
    // Budget data
    orcamentoFull,
    // Medicao data
    medicoesFisicas,
  ] = await Promise.all([
    tenantClient.planta.count({ where: { obraId: id } }),
    tenantClient.etapa.count({ where: { obraId: id } }),
    tenantClient.rdoEntrada.count({ where: { obraId: id } }),
    tenantClient.orcamento.findUnique({
      where: { obraId: id },
      select: { id: true },
    }),
    tenantClient.medicaoFisica.count({ where: { obraId: id } }),
    // Recent plant revisions
    tenantClient.plantaRevisao.findMany({
      where: { planta: { obraId: id }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { planta: { select: { nome: true, disciplina: true } } },
    }),
    // Recent RDO entries
    tenantClient.rdoEntrada.findMany({
      where: { obraId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        data: true,
        texto: true,
        createdAt: true,
        tarefa: { select: { nome: true } },
      },
    }),
    // Recent task updates
    tenantClient.tarefa.findMany({
      where: { obraId: id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        nome: true,
        status: true,
        progressoReal: true,
        updatedAt: true,
        etapa: { select: { nome: true } },
      },
    }),
    // All tasks for progress calculation
    tenantClient.tarefa.findMany({
      where: { obraId: id },
      select: { progressoReal: true },
    }),
    // All requisitions with status for pie chart
    tenantClient.compraRequisicao.findMany({
      where: { obraId: id },
      select: { status: true },
    }),
    // All purchase orders with status for pie chart
    tenantClient.compraPedido.findMany({
      where: { obraId: id },
      select: { status: true, totalEstimado: true },
    }),
    // Total cotações
    tenantClient.compraCotacao.count({
      where: { requisicao: { obraId: id } },
    }),
    // Budget with etapas and items for cost breakdown
    tenantClient.orcamento.findUnique({
      where: { obraId: id },
      include: {
        etapas: {
          include: {
            itens: {
              select: {
                descricao: true,
                quantidade: true,
                custoUnitario: true,
              },
            },
          },
          orderBy: { ordem: "asc" },
        },
      },
    }),
    // Medicoes fisicas for progress over time
    tenantClient.medicaoFisica.findMany({
      where: { obraId: id },
      select: {
        periodo: true,
        status: true,
        itens: {
          select: { percentualMedido: true, acumulado: true },
        },
      },
      orderBy: { periodo: "asc" },
    }),
  ])

  // Calculate overall obra progress
  const progressoGeral =
    tarefasProgress.length > 0
      ? Math.round(
          tarefasProgress.reduce((sum, t) => sum + t.progressoReal, 0) /
            tarefasProgress.length
        )
      : 0

  // Aggregate requisicao statuses for pie chart
  const requisicaoByStatus: Record<string, number> = {}
  for (const r of requisicoes) {
    requisicaoByStatus[r.status] = (requisicaoByStatus[r.status] ?? 0) + 1
  }

  // Aggregate pedido statuses for pie chart
  const pedidoByStatus: Record<string, number> = {}
  let totalPedidos = 0
  for (const p of pedidos) {
    pedidoByStatus[p.status] = (pedidoByStatus[p.status] ?? 0) + 1
    totalPedidos += Number(p.totalEstimado ?? 0)
  }

  // Budget breakdown by etapa
  const orcamentoEtapas = orcamentoFull
    ? orcamentoFull.etapas.map((e) => ({
        nome: e.nome,
        total: e.itens.reduce(
          (sum, i) => sum + Number(i.custoUnitario) * Number(i.quantidade),
          0
        ),
        itemCount: e.itens.length,
      }))
    : []

  const orcamentoTotal = orcamentoEtapas.reduce((sum, e) => sum + e.total, 0)
  const bdi = orcamentoFull ? Number(orcamentoFull.bdi) : 0

  // Medicao progress over time
  const medicaoProgresso = medicoesFisicas.map((m) => {
    const avgAcumulado =
      m.itens.length > 0
        ? m.itens.reduce((sum, i) => sum + Number(i.acumulado), 0) /
          m.itens.length
        : 0
    return {
      periodo: m.periodo,
      status: m.status,
      progresso: Math.round(avgAcumulado * 100) / 100,
    }
  })

  return (
    <ObraDashboardClient
      obraId={obra.id}
      obraNome={obra.nome}
      status={obra.status}
      archived={obra.archived}
      memberCount={obra.members.length}
      plantaCount={plantaCount}
      etapaCount={etapaCount}
      rdoCount={rdoCount}
      hasOrcamento={!!orcamento}
      requisicaoByStatus={requisicaoByStatus}
      requisicaoTotal={requisicoes.length}
      pedidoByStatus={pedidoByStatus}
      pedidoTotal={pedidos.length}
      pedidoValorTotal={totalPedidos}
      cotacaoCount={cotacaoCount}
      medicaoCount={medicaoCount}
      progressoGeral={progressoGeral}
      orcamentoEtapas={orcamentoEtapas}
      orcamentoTotal={orcamentoTotal}
      bdi={bdi}
      medicaoProgresso={medicaoProgresso}
      recentPlantas={recentPlantas.map((r) => ({
        id: r.id,
        revisao: r.revisao,
        changelog: r.changelog,
        plantaNome: r.planta.nome,
        disciplina: r.planta.disciplina,
        createdAt: r.createdAt.toISOString(),
      }))}
      recentRdos={recentRdos.map((r) => ({
        id: r.id,
        data: r.data.toISOString(),
        texto: r.texto,
        tarefaNome: r.tarefa?.nome ?? null,
        createdAt: r.createdAt.toISOString(),
      }))}
      recentTarefas={recentTarefas.map((t) => ({
        id: t.id,
        nome: t.nome,
        status: t.status,
        progressoReal: t.progressoReal,
        etapaNome: t.etapa.nome,
        updatedAt: t.updatedAt.toISOString(),
      }))}
    />
  )
}
