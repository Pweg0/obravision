import { listPlantasByObra, type PlantaWithRevisoes } from "@/lib/actions/planta"

const DISCIPLINA_LABELS: Record<string, string> = {
  ARQUITETURA: "Arquitetura",
  ESTRUTURAL: "Estrutural",
  ELETRICA: "Eletrica",
  HIDRAULICA: "Hidraulica",
  INCENDIO: "Incendio",
  TOPOGRAFIA: "Topografia",
  CUSTOMIZADO: "Customizado",
}

interface PlantaListByDisciplinaProps {
  obraId: string
}

export async function PlantaListByDisciplina({ obraId }: PlantaListByDisciplinaProps) {
  const grouped = await listPlantasByObra(obraId)
  const disciplinas = Object.keys(grouped) as string[]

  if (disciplinas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">Nenhuma planta cadastrada ainda.</p>
        <p className="text-sm mt-1">Clique em &quot;Upload planta&quot; para adicionar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {disciplinas.map((disciplina) => {
        const plantas = grouped[disciplina] as PlantaWithRevisoes[]
        const label = DISCIPLINA_LABELS[disciplina] ?? disciplina

        return (
          <div key={disciplina}>
            {/* Group header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {label}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {plantas.length} {plantas.length === 1 ? "planta" : "plantas"}
                </span>
              </h3>
            </div>

            {/* Plant list */}
            <div className="space-y-2">
              {plantas.map((planta) => {
                const revisoes = planta.revisoes
                const latestRevisao = revisoes[0]
                const revisaoLabel = latestRevisao?.revisao ?? "—"
                const uploadDate = latestRevisao?.createdAt
                  ? new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(latestRevisao.createdAt))
                  : "—"

                return (
                  <a
                    key={planta.id}
                    href={`/dashboard/obras/${obraId}/plantas/${planta.id}`}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-teal-400 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      {/* PDF icon */}
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-red-600">PDF</span>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-800 group-hover:text-teal-700">
                          {planta.nome}
                          {planta.disciplinaCustom && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({planta.disciplinaCustom})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Enviado em {uploadDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Revision count */}
                      <span className="text-xs text-gray-400">
                        {revisoes.length} {revisoes.length === 1 ? "revisao" : "revisoes"}
                      </span>

                      {/* Latest revision badge */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {revisaoLabel} atual
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
