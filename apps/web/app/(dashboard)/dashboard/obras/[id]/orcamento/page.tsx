import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@projetapro/db"
import { auth } from "@/lib/auth"
import { createTenantClient } from "@projetapro/db/rls-client"
import { OrcamentoTable } from "@/components/orcamento/OrcamentoTable"
import { BdiConfig } from "@/components/orcamento/BdiConfig"
import { PropostaExport } from "@/components/orcamento/PropostaExport"
import { createOrcamento } from "@/lib/actions/orcamento"
import { Button } from "@/components/ui/button"

export default async function OrcamentoPage({
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

  const canEdit =
    session.user.role === "ADMIN" || session.user.role === "ENGENHEIRO"

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <span className="text-foreground">Orcamento</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orcamento</h1>
          <p className="text-sm text-muted-foreground mt-1">{obra.nome}</p>
        </div>
        {orcamento && (
          <PropostaExport
            orcamentoId={orcamento.id}
            obraId={obraId}
            existingPdfR2Key={orcamento.pdfR2Key}
          />
        )}
      </div>

      {/* Content */}
      {!orcamento ? (
        <div className="rounded-lg border p-8 text-center space-y-4">
          <p className="text-muted-foreground">
            Nenhum orcamento criado para esta obra ainda.
          </p>
          {canEdit && (
            <form
              action={async () => {
                "use server"
                await createOrcamento(obraId)
              }}
            >
              <Button type="submit">Criar Orcamento</Button>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* BDI config */}
          {canEdit && (
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Configuracao do BDI
              </h2>
              <BdiConfig
                orcamentoId={orcamento.id}
                currentBdi={parseFloat(String(orcamento.bdi))}
              />
            </div>
          )}

          {/* Orcamento table */}
          <OrcamentoTable
            orcamentoId={orcamento.id}
            etapas={orcamento.etapas.map((etapa) => ({
              id: etapa.id,
              nome: etapa.nome,
              ordem: etapa.ordem,
              itens: etapa.itens.map((item) => ({
                id: item.id,
                descricao: item.descricao,
                unidade: item.unidade,
                quantidade: item.quantidade.toString(),
                custoUnitario: item.custoUnitario.toString(),
                sinapiCodigo: item.sinapiCodigo,
              })),
            }))}
            bdi={parseFloat(String(orcamento.bdi))}
            obraId={obraId}
            obraEstado={obra.estado}
          />
        </div>
      )}
    </div>
  )
}
