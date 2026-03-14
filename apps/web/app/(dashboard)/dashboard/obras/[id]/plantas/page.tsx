import { notFound } from "next/navigation"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { Suspense } from "react"
import { PlantaListByDisciplina } from "./PlantaListByDisciplina"
import { PlantaUploadForm } from "./PlantaUploadForm"

export default async function PlantasPage({
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
    select: { id: true, nome: true },
  })

  if (!obra) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plantas</h1>
      </div>

      {/* Upload form */}
      <PlantaUploadForm obraId={id} />

      {/* Plant list grouped by discipline */}
      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando plantas...</div>}>
        <PlantaListByDisciplina obraId={id} />
      </Suspense>
    </div>
  )
}
