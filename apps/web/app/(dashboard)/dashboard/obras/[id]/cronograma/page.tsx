import { notFound } from "next/navigation"
import { prisma } from "@obravision/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@obravision/db/rls-client"
import { listCronograma } from "@/lib/actions/cronograma"
import { GanttView } from "@/components/cronograma/GanttView"
import Link from "next/link"

export default async function CronogramaPage({
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
      members: true,
    },
  })

  if (!obra) notFound()

  // Fetch member user data for responsavel dropdowns
  const memberUserIds = obra.members.map((m: { userId: string }) => m.userId)
  const memberUsers = await prisma.user.findMany({
    where: { id: { in: memberUserIds } },
    select: { id: true, name: true, email: true, image: true },
  })

  const membersWithUsers = obra.members.map(
    (member: { id: string; userId: string; role: string }) => ({
      ...member,
      user: memberUsers.find((u) => u.id === member.userId),
    })
  )

  // Load cronograma data
  const etapas = await listCronograma(id)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/obras" className="hover:text-foreground transition-colors">
          Obras
        </Link>
        <span>/</span>
        <Link href={`/dashboard/obras/${id}`} className="hover:text-foreground transition-colors">
          {obra.nome}
        </Link>
        <span>/</span>
        <span className="text-foreground">Cronograma</span>
      </div>

      {/* Tab navigation — matching ObraDetailClient style */}
      <div className="flex border-b gap-1">
        <Link
          href={`/dashboard/obras/${id}`}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-px"
        >
          Detalhes
        </Link>
        <span className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary -mb-px">
          Cronograma
        </span>
        {/* RDO tab will be added in Plan 03 */}
      </div>

      {/* Gantt chart */}
      <GanttView
        etapas={etapas.map((e: any) => ({
          ...e,
          tarefas: e.tarefas.map((t: any) => ({
            ...t,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
          })),
        }))}
        obraId={id}
        members={membersWithUsers}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
