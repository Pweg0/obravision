import { listMedicoesFisicas, listMedicoesContrato } from "@/lib/actions/medicoes"
import { getOrcamento } from "@/lib/actions/orcamento"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MedicoesClient } from "./MedicoesClient"

interface MedicoesPageProps {
  params: Promise<{ id: string }>
}

export default async function MedicoesPage({ params }: MedicoesPageProps) {
  const { id: obraId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [medicoesFisicas, medicoesContrato, orcamento] = await Promise.all([
    listMedicoesFisicas(obraId),
    listMedicoesContrato(obraId),
    getOrcamento(obraId),
  ])

  const latestProgressoGeral = medicoesFisicas[0]?.progressoGeral ?? 0

  return (
    <MedicoesClient
      obraId={obraId}
      initialMedicoesFisicas={medicoesFisicas}
      initialMedicoesContrato={medicoesContrato}
      orcamento={orcamento}
      latestProgressoGeral={latestProgressoGeral}
      currentUserRole={session.user.role}
    />
  )
}
