import { notFound } from "next/navigation"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { EquipeClient } from "./EquipeClient"

export default async function EquipePage({
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

  // Fetch member user data separately
  const memberUserIds = obra.members.map((m: { userId: string }) => m.userId)
  const memberUsers = await prisma.user.findMany({
    where: { id: { in: memberUserIds } },
    select: { id: true, name: true, email: true, image: true },
  })

  const membersWithUsers = obra.members.map((member: { userId: string; role: string; id: string }) => ({
    ...member,
    user: memberUsers.find((u) => u.id === member.userId),
  }))

  return (
    <EquipeClient
      obraId={obra.id}
      members={membersWithUsers}
      currentUserRole={session.user.role}
    />
  )
}
