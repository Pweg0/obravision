import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 bg-gradient-to-b from-blue-50/60 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-6">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Novo: Modulo de plantas com IA
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E293B] leading-tight tracking-tight">
              Gestao completa para sua{" "}
              <span className="text-[#2563EB]">engenharia civil</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
              Empresa, obras, estoque e plantas em uma unica plataforma. Reduza custos, elimine retrabalho e entregue projetos no prazo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] rounded-xl transition-colors duration-200 shadow-lg shadow-orange-200"
              >
                Comece gratis por 14 dias
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200"
              >
                Ver como funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">Sem cartao de credito. Cancele quando quiser.</p>
          </div>

          {/* Hero illustration - Dashboard mockup */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-blue-200/40 border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400 font-medium">projetapro.app/dashboard</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Obras ativas</p>
                    <p className="text-2xl font-bold text-[#1E293B]">12</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Itens em estoque</p>
                    <p className="text-2xl font-bold text-[#1E293B]">2.847</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Plantas ativas</p>
                    <p className="text-2xl font-bold text-[#1E293B]">34</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Residencial Aurora</span>
                      <span className="text-[#2563EB] font-semibold">78%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full"><div className="h-2 bg-[#2563EB] rounded-full" style={{ width: "78%" }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Comercial Centro</span>
                      <span className="text-[#2563EB] font-semibold">45%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full"><div className="h-2 bg-[#3B82F6] rounded-full" style={{ width: "45%" }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Ponte Rio Verde</span>
                      <span className="text-[#2563EB] font-semibold">92%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full"><div className="h-2 bg-green-500 rounded-full" style={{ width: "92%" }} /></div>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <p className="text-xs text-amber-800 font-medium">Estoque de cimento abaixo do minimo — 12 sacos restantes</p>
                </div>
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Vistoria concluida</p>
                <p className="text-xs text-gray-500">Bloco A — ha 2 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
