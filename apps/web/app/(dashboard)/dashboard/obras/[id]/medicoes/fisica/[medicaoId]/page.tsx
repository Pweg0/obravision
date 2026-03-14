import { getMedicaoFisica } from "@/lib/actions/medicoes"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MedicaoFisicaDetailClient } from "./MedicaoFisicaDetailClient"

interface MedicaoFisicaPageProps {
  params: Promise<{ id: string; medicaoId: string }>
}

export default async function MedicaoFisicaPage({ params }: MedicaoFisicaPageProps) {
  const { id: obraId, medicaoId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const medicao = await getMedicaoFisica(medicaoId)
  if (!medicao) redirect(`/dashboard/obras/${obraId}/medicoes`)

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Medicao Fisica — {medicao.periodo}</h1>

      <MedicaoFisicaDetailClient
        obraId={obraId}
        medicao={medicao}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
