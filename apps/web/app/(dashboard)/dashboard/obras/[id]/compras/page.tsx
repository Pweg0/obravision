import { listRequisicoes } from "@/lib/actions/compras"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ComprasClient } from "./ComprasClient"

interface ComprasPageProps {
  params: Promise<{ id: string }>
}

export default async function ComprasPage({ params }: ComprasPageProps) {
  const { id: obraId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const requisicoes = await listRequisicoes(obraId)

  return (
    <ComprasClient
      obraId={obraId}
      initialRequisicoes={requisicoes}
      currentUserRole={session.user.role}
      currentUserId={session.user.id}
    />
  )
}
