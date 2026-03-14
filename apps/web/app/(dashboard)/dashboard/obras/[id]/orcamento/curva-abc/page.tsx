import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { CurvaABC } from "@/components/orcamento/CurvaABC"

export default async function CurvaABCPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: obraId } = await params
  const session = await auth()

  if (!session?.user?.empresaId) notFound()

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
  })

  if (!empresa) notFound()

  const tenantClient = createTenantClient(empresa.tenantId)

  const obra = await tenantClient.obra.findUnique({ where: { id: obraId } })
  if (!obra) notFound()

  const orcamento = await tenantClient.orcamento.findUnique({
    where: { obraId },
    include: {
      etapas: {
        orderBy: { ordem: "asc" },
        include: {
          itens: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!orcamento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/obras" className="hover:text-foreground transition-colors">Obras</Link>
          <span>/</span>
          <Link href={`/dashboard/obras/${obraId}`} className="hover:text-foreground transition-colors">{obra.nome}</Link>
          <span>/</span>
          <Link href={`/dashboard/obras/${obraId}/orcamento`} className="hover:text-foreground transition-colors">Orcamento</Link>
          <span>/</span>
          <span className="text-foreground">Curva ABC</span>
        </div>
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          Nenhum orcamento criado para esta obra ainda.{" "}
          <Link href={`/dashboard/obras/${obraId}/orcamento`} className="underline hover:text-foreground">
            Ir para Orcamento
          </Link>
        </div>
      </div>
    )
  }

  // Flatten all items from all etapas with etapa name for context
  const allItems = orcamento.etapas.flatMap((etapa) =>
    etapa.itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      unidade: item.unidade,
      quantidade: item.quantidade.toString(),
      custoUnitario: item.custoUnitario.toString(),
      sinapiCodigo: item.sinapiCodigo,
      etapaNome: etapa.nome,
    }))
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/obras" className="hover:text-foreground transition-colors">Obras</Link>
        <span>/</span>
        <Link href={`/dashboard/obras/${obraId}`} className="hover:text-foreground transition-colors">{obra.nome}</Link>
        <span>/</span>
        <Link href={`/dashboard/obras/${obraId}/orcamento`} className="hover:text-foreground transition-colors">Orcamento</Link>
        <span>/</span>
        <span className="text-foreground">Curva ABC</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Curva ABC de Insumos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {obra.nome} — {allItems.length} {allItems.length === 1 ? "item" : "itens"}
          </p>
        </div>
        <Link
          href={`/dashboard/obras/${obraId}/orcamento`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar ao Orcamento
        </Link>
      </div>

      {/* Curva ABC component */}
      <CurvaABC items={allItems} />
    </div>
  )
}
