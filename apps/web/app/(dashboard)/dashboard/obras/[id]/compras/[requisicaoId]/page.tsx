import { listRequisicoes, listCotacoes } from "@/lib/actions/compras"
import { listFornecedores } from "@/lib/actions/fornecedor"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { RequisicaoDetailClient } from "./RequisicaoDetailClient"

interface RequisicaoDetailPageProps {
  params: Promise<{ id: string; requisicaoId: string }>
}

export default async function RequisicaoDetailPage({ params }: RequisicaoDetailPageProps) {
  const { id: obraId, requisicaoId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Load data in parallel
  const [requisicoes, cotacoes, fornecedores] = await Promise.all([
    listRequisicoes(obraId),
    listCotacoes(requisicaoId),
    listFornecedores(),
  ])

  const requisicao = requisicoes.find((r) => r.id === requisicaoId)
  if (!requisicao) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <RequisicaoDetailClient
        obraId={obraId}
        requisicao={requisicao}
        initialCotacoes={cotacoes}
        fornecedores={fornecedores}
        currentUserRole={session.user.role}
        currentUserId={session.user.id}
      />
    </div>
  )
}
