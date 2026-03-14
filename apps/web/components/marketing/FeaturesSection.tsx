import {
  MessageSquare,
  FileStack,
  BookOpen,
  CalendarCheck,
  ShoppingCart,
  BarChart3,
} from "lucide-react"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Comentarios Ancorados em Plantas",
    description:
      "Clique em qualquer elemento do projeto — parede, viga, janela — e deixe um comentario diretamente sobre ele. Sem prints, sem confusao sobre qual revisao.",
  },
  {
    icon: <FileStack className="w-6 h-6" />,
    title: "Versionamento de Plantas",
    description:
      "Carregue revisoes (R0, R1, R2...) e compare versoes lado a lado. Historico completo com data e responsavel por cada revisao.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Diario de Obra com Fotos",
    description:
      "Registre o progresso diario diretamente do canteiro com fotos, status das equipes e ocorrencias. Tudo indexado por data e obra.",
  },
  {
    icon: <CalendarCheck className="w-6 h-6" />,
    title: "Cronograma Interativo",
    description:
      "Planeje tarefas, atribua responsaveis e acompanhe o progresso em tempo real. Alertas automaticos de atraso para manter o cronograma em dia.",
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: "Orcamento e Compras",
    description:
      "Controle o orcamento previsto versus realizado, gerencie requisicoes de material e acompanhe o historico de compras por obra.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Relatorios Gerenciais",
    description:
      "Exporta relatorios de obra em PDF para clientes e investidores. Dashboard executivo com indicadores de progresso, custo e qualidade.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Tudo que sua obra precisa em um lugar so
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Do projeto ao canteiro, do orcamento ao relatorio — ProjetaPro integra cada etapa da
            gestao de obras em uma plataforma visual colaborativa.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group flex flex-col gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-200"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors duration-200">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
