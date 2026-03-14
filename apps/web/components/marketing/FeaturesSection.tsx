export function FeaturesSection() {
  const features = [
    {
      title: "Gestao da Empresa",
      description: "Financeiro, equipe, contratos e documentacao centralizados. Dashboards em tempo real para decisoes rapidas.",
      iconBg: "bg-blue-100 group-hover:bg-[#2563EB]",
      iconColor: "text-blue-600 group-hover:text-white",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      ),
    },
    {
      title: "Controle de Obra",
      description: "Cronograma, diario de obra, vistorias e acompanhamento de progresso com fotos e checklist digital.",
      iconBg: "bg-blue-100 group-hover:bg-[#2563EB]",
      iconColor: "text-blue-600 group-hover:text-white",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      ),
    },
    {
      title: "Gestao de Estoque",
      description: "Controle de materiais com alertas automaticos, rastreabilidade por obra e integracao com fornecedores.",
      iconBg: "bg-amber-100 group-hover:bg-[#2563EB]",
      iconColor: "text-amber-600 group-hover:text-white",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      ),
    },
    {
      title: "Plantas e Projetos",
      description: "Visualize, versione e compartilhe plantas com a equipe. Anotacoes colaborativas e historico completo.",
      iconBg: "bg-green-100 group-hover:bg-[#2563EB]",
      iconColor: "text-green-600 group-hover:text-white",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      ),
    },
  ]

  return (
    <section id="funcionalidades" className="py-16 sm:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Funcionalidades</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">Tudo que sua empresa precisa em um so lugar</h2>
          <p className="mt-4 text-lg text-gray-600">Quatro modulos integrados para cobrir toda a operacao da sua engenharia.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-250 group"
            >
              <div className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center mb-5 transition-colors duration-250`}>
                <svg className={`w-6 h-6 ${feature.iconColor} transition-colors duration-250`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
