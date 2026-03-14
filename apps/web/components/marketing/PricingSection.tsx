import Link from "next/link"

const checkIcon = (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

export function PricingSection() {
  return (
    <section id="planos" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Planos</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">Escolha o plano ideal para sua empresa</h2>
          <p className="mt-4 text-lg text-gray-600">14 dias gratis em todos os planos. Sem cartao de credito.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-blue-200 transition-colors duration-200">
            <h3 className="text-lg font-bold text-[#1E293B]">Starter</h3>
            <p className="text-sm text-gray-500 mt-1">Para pequenas empresas</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-[#1E293B]">R$97</span>
              <span className="text-sm text-gray-500 font-medium">/mes</span>
            </div>
            <ul className="mt-8 space-y-3">
              {["Ate 3 obras ativas", "5 usuarios", "Gestao de estoque basico", "Suporte por e-mail"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">{checkIcon}{item}</li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 block text-center px-6 py-3.5 text-sm font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200">
              Comecar gratis
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#2563EB] relative shadow-lg shadow-blue-100/40">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#2563EB] text-white text-xs font-bold rounded-full">Mais popular</div>
            <h3 className="text-lg font-bold text-[#1E293B]">Profissional</h3>
            <p className="text-sm text-gray-500 mt-1">Para empresas em crescimento</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-[#1E293B]">R$247</span>
              <span className="text-sm text-gray-500 font-medium">/mes</span>
            </div>
            <ul className="mt-8 space-y-3">
              {["Obras ilimitadas", "20 usuarios", "Plantas com versionamento", "Estoque com alertas automaticos", "Relatorios avancados", "Suporte prioritario"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">{checkIcon}{item}</li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 block text-center px-6 py-3.5 text-sm font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] rounded-xl transition-colors duration-200 shadow-lg shadow-orange-200">
              Comecar gratis
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-blue-200 transition-colors duration-200">
            <h3 className="text-lg font-bold text-[#1E293B]">Enterprise</h3>
            <p className="text-sm text-gray-500 mt-1">Para grandes operacoes</p>
            <div className="mt-6">
              <span className="text-4xl font-extrabold text-[#1E293B]">Sob consulta</span>
            </div>
            <ul className="mt-8 space-y-3">
              {["Tudo do Profissional", "Usuarios ilimitados", "API e integracoes", "SLA e suporte dedicado", "Onboarding personalizado"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">{checkIcon}{item}</li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 block text-center px-6 py-3.5 text-sm font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200">
              Falar com vendas
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
