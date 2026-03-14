import { getMedicaoContrato } from "@/lib/actions/medicoes"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MedicaoContratoDetailClient } from "./MedicaoContratoDetailClient"

interface MedicaoContratoPageProps {
  params: Promise<{ id: string; medicaoId: string }>
}

export default async function MedicaoContratoPage({ params }: MedicaoContratoPageProps) {
  const { id: obraId, medicaoId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const medicao = await getMedicaoContrato(medicaoId)
  if (!medicao) redirect(`/dashboard/obras/${obraId}/medicoes`)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={`/dashboard/obras/${obraId}/medicoes`} className="hover:text-foreground transition-colors">
          Medicoes
        </Link>
        <span>/</span>
        <span>Medicao Contrato — {medicao.empreiteiroId} ({medicao.periodo})</span>
      </div>

      <MedicaoContratoDetailClient
        obraId={obraId}
        medicao={medicao}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
