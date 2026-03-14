import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import { ObraListWidget } from "@/components/dashboard/ObraListWidget"
import { ActivityWidget } from "@/components/dashboard/ActivityWidget"
import { PlaceholderWidget } from "@/components/dashboard/PlaceholderWidget"
import { ProgressWidget } from "@/components/cronograma/ProgressWidget"
import { getProgressData } from "@/lib/actions/rdo"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.empresaId) {
    return null
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) return null

  const tenantClient = createTenantClient(empresa.tenantId)

  // Fetch recent obras
  const obras = await tenantClient.obra.findMany({
    where: { archived: false },
    include: { status: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })

  // Derive activity feed from recent obra/member changes
  const recentObras = await tenantClient.obra.findMany({
    include: { status: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const recentMembers = await tenantClient.obraMember.findMany({
    include: { obra: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Build activity items
  type ActivityItem = {
    id: string
    type: "obra_created" | "obra_updated" | "member_joined"
    title: string
    subtitle: string
    time: Date
  }

  const activityItems: ActivityItem[] = [
    ...recentObras.map((o: { id: string; nome: string; createdAt: Date; updatedAt: Date }) => ({
      id: `obra-created-${o.id}`,
      type: "obra_created" as const,
      title: `Obra criada: ${o.nome}`,
      subtitle: empresa.nome,
      time: o.createdAt,
    })),
    ...recentMembers.map((m: { id: string; obra: { nome: string }; createdAt: Date }) => ({
      id: `member-${m.id}`,
      type: "member_joined" as const,
      title: `Membro adicionado a ${m.obra.nome}`,
      subtitle: empresa.nome,
      time: m.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  // Fetch progress data for the most recently updated active obra
  const firstActiveObra = obras[0] ?? null
  const progressData = firstActiveObra
    ? await getProgressData(firstActiveObra.id)
    : []

  const displayName = session.user.name ?? session.user.email ?? "Usuario"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ola, {displayName.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aqui esta um resumo do que esta acontecendo em {empresa.nome}.
        </p>
      </div>

      {/* Widget grid: 3 cols on lg, 2 on md, 1 on sm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Obra list widget (spans 2 cols on lg) */}
        <div className="lg:col-span-2">
          <ObraListWidget obras={obras} />
        </div>

        {/* Activity widget */}
        <div>
          <ActivityWidget items={activityItems} />
        </div>

        {/* Progress widget (S-curve) for first active obra */}
        {firstActiveObra ? (
          <ProgressWidget
            data={progressData}
            obraName={firstActiveObra.nome}
          />
        ) : (
          <PlaceholderWidget
            title="Progresso da Obra"
            description="Adicione um cronograma para ver o progresso planejado vs real."
          />
        )}

        {/* Placeholder widgets */}
        <PlaceholderWidget
          title="Alertas de Clima"
          description="Alertas meteorologicos por obra disponivel em breve."
        />
        <PlaceholderWidget
          title="Comentarios Pendentes"
          description="Anotacoes e comentarios em plantas e fotos disponivel em breve."
        />
      </div>
    </div>
  )
}
