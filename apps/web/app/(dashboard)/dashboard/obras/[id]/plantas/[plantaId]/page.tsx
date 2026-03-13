import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { listPinsByRevisao } from "@/lib/actions/pin"
import { PlantaViewerClient } from "./PlantaViewerClient"

export default async function PlantaViewerPage({
  params,
}: {
  params: Promise<{ id: string; plantaId: string }>
}) {
  const { id: obraId, plantaId } = await params

  const session = await auth()
  if (!session?.user?.empresaId) {
    notFound()
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) notFound()

  const tenantClient = createTenantClient(empresa.tenantId)

  // Fetch planta with all its active revisoes ordered newest-first
  const planta = await tenantClient.planta.findUnique({
    where: { id: plantaId, deletedAt: null },
    include: {
      revisoes: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!planta || planta.obraId !== obraId) notFound()

  const revisoes = planta.revisoes

  // Determine the current (latest) revision
  const currentRevisao = revisoes[0] ?? null

  // Fetch pins for the latest revision
  const pins = currentRevisao ? await listPinsByRevisao(currentRevisao.id) : []

  const r2PublicUrl = process.env.R2_PUBLIC_URL ?? ""

  return (
    <PlantaViewerClient
      planta={{
        id: planta.id,
        nome: planta.nome,
        disciplina: planta.disciplina,
        obraId: planta.obraId,
      }}
      revisoes={revisoes}
      initialPins={pins}
      currentRevisao={currentRevisao}
      userRole={session.user.role}
      userId={session.user.id}
      r2PublicUrl={r2PublicUrl}
    />
  )
}
