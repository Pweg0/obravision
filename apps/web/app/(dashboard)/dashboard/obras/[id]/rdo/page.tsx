import { auth } from "@/lib/auth"
import { prisma } from "@projetapro/db"
import { createTenantClient } from "@projetapro/db/rls-client"
import { redirect } from "next/navigation"
import Link from "next/link"
import { RdoCard } from "@/components/rdo/RdoCard"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RdoPage({ params }: PageProps) {
  const { id: obraId } = await params

  const session = await auth()
  if (!session?.user?.empresaId) {
    redirect("/login")
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })
  if (!empresa) redirect("/login")

  const tenantClient = createTenantClient(empresa.tenantId)

  // Verify obra exists and user has access
  const obra = await tenantClient.obra.findUnique({
    where: { id: obraId },
  })
  if (!obra) redirect("/dashboard/obras")

  // Fetch all diary entries
  const entradas = await tenantClient.rdoEntrada.findMany({
    where: { obraId },
    include: {
      fotos: {
        orderBy: { ordem: "asc" },
      },
      tarefa: {
        include: { etapa: true },
      },
    },
    orderBy: { data: "desc" },
  })

  const canCreate =
    session.user.role === "ADMIN" || session.user.role === "ENGENHEIRO"

  const r2PublicBase = process.env.R2_PUBLIC_BASE_URL ?? null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diario de Obra</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {entradas.length} {entradas.length === 1 ? "entrada" : "entradas"} registradas
          </p>
        </div>
        {canCreate && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-white">
            <Link href={`/dashboard/obras/${obraId}/rdo/nova`}>Nova Entrada</Link>
          </Button>
        )}
      </div>

      {/* Diary entries */}
      {entradas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <svg
            className="w-10 h-10 text-muted-foreground mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            Nenhuma entrada no diario ainda.
          </p>
          {canCreate && (
            <Link
              href={`/dashboard/obras/${obraId}/rdo/nova`}
              className="inline-block mt-3 text-sm text-primary hover:underline"
            >
              Criar primeira entrada
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {entradas.map((entrada) => (
            <RdoCard
              key={entrada.id}
              entrada={entrada}
              r2PublicBase={r2PublicBase ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
