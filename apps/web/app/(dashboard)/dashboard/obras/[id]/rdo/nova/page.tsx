import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import { redirect } from "next/navigation"
import { RdoForm } from "@/components/rdo/RdoForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function NovaRdoPage({ params }: PageProps) {
  const { id: obraId } = await params

  const session = await auth()
  if (!session?.user?.empresaId) {
    redirect("/login")
  }

  // ADMIN and ENGENHEIRO only
  if (session.user.role !== "ADMIN" && session.user.role !== "ENGENHEIRO") {
    redirect(`/dashboard/obras/${obraId}/rdo`)
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })
  if (!empresa) redirect("/login")

  const tenantClient = createTenantClient(empresa.tenantId)

  // Load obra with lat/lon for weather
  const obra = await tenantClient.obra.findUnique({
    where: { id: obraId },
  })
  if (!obra) redirect("/dashboard/obras")

  // Load tarefas for the task selector (only EM_ANDAMENTO and PENDENTE are relevant)
  const etapas = await tenantClient.etapa.findMany({
    where: { obraId },
    include: {
      tarefas: {
        where: {
          status: { in: ["EM_ANDAMENTO", "PENDENTE"] },
        },
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { ordem: "asc" },
  })

  // Flatten tarefas with etapa name for the form
  const tarefas = etapas.flatMap((e) =>
    e.tarefas.map((t) => ({
      id: t.id,
      nome: t.nome,
      etapa: { nome: e.nome },
    }))
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova Entrada no Diario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registre as atividades, fotos e condicoes do dia
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <RdoForm
          obraId={obraId}
          lat={obra.lat}
          lon={obra.lon}
          tarefas={tarefas}
        />
      </div>
    </div>
  )
}
