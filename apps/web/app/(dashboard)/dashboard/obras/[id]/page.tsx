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

  // Count related data for dashboard metrics
  const [plantaCount, etapaCount, rdoCount, orcamento, requisicaoCount, medicaoCount] = await Promise.all([
    tenantClient.planta.count({ where: { obraId: id } }),
    tenantClient.etapa.count({ where: { obraId: id } }),
    tenantClient.rdoEntrada.count({ where: { obraId: id } }),
    tenantClient.orcamento.findUnique({
      where: { obraId: id },
      select: { id: true },
    }),
    tenantClient.compraRequisicao.count({ where: { obraId: id } }),
    tenantClient.medicaoFisica.count({ where: { obraId: id } }),
  ])

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
    />
  )
}
