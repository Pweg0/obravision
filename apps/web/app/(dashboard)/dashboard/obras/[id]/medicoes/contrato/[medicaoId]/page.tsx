import { getMedicaoContrato } from "@/lib/actions/medicoes"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
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
      <h1 className="text-2xl font-bold">Medicao Contrato — {medicao.periodo}</h1>

      <MedicaoContratoDetailClient
        obraId={obraId}
        medicao={medicao}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
