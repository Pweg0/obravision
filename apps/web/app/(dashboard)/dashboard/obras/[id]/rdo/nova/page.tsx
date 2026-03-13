import { auth } from "@/lib/auth"
import { prisma } from "@obravision/db"
import { createTenantClient } from "@obravision/db/rls-client"
import { redirect } from "next/navigation"
import Link from "next/link"
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
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dashboard/obras" className="hover:text-foreground transition-colors">
            Obras
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/obras/${obraId}`}
            className="hover:text-foreground transition-colors"
          >
            {obra.nome}
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/obras/${obraId}/rdo`}
            className="hover:text-foreground transition-colors"
          >
            Diario de Obra
          </Link>
          <span>/</span>
          <span>Nova Entrada</span>
        </div>
        <h1 className="text-2xl font-bold">Nova Entrada no Diario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Registre as atividades, fotos e condicoes do dia para {obra.nome}
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
