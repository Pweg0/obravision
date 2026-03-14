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

  // Count related data + fetch recent activity for dashboard feeds
  const [
    plantaCount,
    etapaCount,
    rdoCount,
    orcamento,
    requisicaoCount,
    medicaoCount,
    recentPlantas,
    recentRdos,
    recentTarefas,
    tarefasProgress,
  ] = await Promise.all([
    tenantClient.planta.count({ where: { obraId: id } }),
    tenantClient.etapa.count({ where: { obraId: id } }),
    tenantClient.rdoEntrada.count({ where: { obraId: id } }),
    tenantClient.orcamento.findUnique({
      where: { obraId: id },
      select: { id: true },
    }),
    tenantClient.compraRequisicao.count({ where: { obraId: id } }),
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
  ])

  // Calculate overall obra progress (avg of all task progress)
  const progressoGeral =
    tarefasProgress.length > 0
      ? Math.round(
          tarefasProgress.reduce((sum, t) => sum + t.progressoReal, 0) /
            tarefasProgress.length
        )
      : 0

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
      requisicaoCount={requisicaoCount}
      medicaoCount={medicaoCount}
      progressoGeral={progressoGeral}
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
