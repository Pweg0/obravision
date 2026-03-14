export function HowItWorks() {
  const steps = [
    { num: 1, title: "Crie sua conta", desc: "Cadastre sua empresa em menos de 2 minutos. Sem burocracia, sem cartao de credito." },
    { num: 2, title: "Configure seus projetos", desc: "Importe seus dados ou comece do zero. Cadastre obras, equipe e materiais no sistema." },
    { num: 3, title: "Gerencie com clareza", desc: "Acompanhe obras, controle estoque e compartilhe plantas com sua equipe em tempo real." },
  ]

  return (
    <section id="como-funciona" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Como funciona</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">Comece em minutos, nao em semanas</h2>
          <p className="mt-4 text-lg text-gray-600">Tres passos simples para transformar a gestao da sua empresa.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-16 h-16 bg-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] mb-3">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
