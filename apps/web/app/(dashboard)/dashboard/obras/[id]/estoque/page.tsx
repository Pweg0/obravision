import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listDepositos, getEstoqueAtual } from "@/lib/actions/estoque"
import { EstoqueClient } from "./EstoqueClient"

interface EstoquePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ deposito?: string }>
}

export default async function EstoquePage({ params, searchParams }: EstoquePageProps) {
  const { id: obraId } = await params
  const { deposito: depositoIdParam } = await searchParams

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const depositos = await listDepositos(obraId)

  // Select deposito from query param or default to first
  const selectedDepositoId = depositoIdParam
    ?? (depositos.length > 0 ? depositos[0].id : null)

  const items = selectedDepositoId
    ? await getEstoqueAtual(selectedDepositoId)
    : []

  return (
    <EstoqueClient
      obraId={obraId}
      depositos={depositos}
      initialItems={items}
      initialDepositoId={selectedDepositoId}
    />
  )
}
