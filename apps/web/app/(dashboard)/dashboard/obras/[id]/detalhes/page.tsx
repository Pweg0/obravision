import { notFound } from "next/navigation"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { listStatuses } from "@/lib/actions/status"
import { DetalhesClient } from "./DetalhesClient"

export default async function DetalhesPage({
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
    include: { status: true },
  })

  if (!obra) notFound()

  const statuses = await listStatuses()

  return (
    <DetalhesClient
      obra={obra}
      statuses={statuses}
      currentUserRole={session.user.role}
    />
  )
}
