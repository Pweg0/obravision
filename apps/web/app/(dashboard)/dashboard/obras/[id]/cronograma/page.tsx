import { notFound } from "next/navigation"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { listCronograma } from "@/lib/actions/cronograma"
import { GanttView } from "@/components/cronograma/GanttView"

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
      <h1 className="text-2xl font-bold">Cronograma</h1>

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
