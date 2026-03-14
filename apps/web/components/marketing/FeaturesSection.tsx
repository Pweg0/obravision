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
  accent: string
}

const features: Feature[] = [
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Comentarios Ancorados",
    description:
      "Clique em qualquer elemento do projeto e deixe um comentario diretamente sobre ele. Sem prints, sem confusao sobre qual revisao.",
    accent: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    icon: <FileStack className="w-5 h-5" />,
    title: "Versionamento de Plantas",
    description:
      "Carregue revisoes (R0, R1, R2...) e compare versoes lado a lado. Historico completo com data e responsavel.",
    accent: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Diario de Obra",
    description:
      "Registre o progresso diario com fotos, status das equipes e ocorrencias. Tudo indexado por data e obra.",
    accent: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: <CalendarCheck className="w-5 h-5" />,
    title: "Cronograma Interativo",
    description:
      "Planeje tarefas, atribua responsaveis e acompanhe o progresso em tempo real com alertas de atraso.",
    accent: "from-violet-500/20 to-violet-600/5",
  },
  {
    icon: <ShoppingCart className="w-5 h-5" />,
    title: "Orcamento e Compras",
    description:
      "Controle orcamento previsto vs realizado, gerencie requisicoes de material e historico de compras.",
    accent: "from-rose-500/20 to-rose-600/5",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Relatorios Gerenciais",
    description:
      "Exporte relatorios em PDF para clientes. Dashboard executivo com indicadores de progresso e custo.",
    accent: "from-cyan-500/20 to-cyan-600/5",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Recursos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Tudo que sua obra precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Do projeto ao canteiro, do orcamento ao relatorio — ProjetaPro integra cada etapa
            em uma plataforma visual colaborativa.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border hover:border-primary/30 shadow-sm hover:shadow-premium transition-all duration-300 cursor-pointer"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${feature.accent} text-primary`}>
                {feature.icon}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>

              {/* Hover indicator */}
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary/0 group-hover:bg-primary/40 rounded-full transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
