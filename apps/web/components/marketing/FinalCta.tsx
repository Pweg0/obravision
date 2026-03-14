import Link from "next/link"

export function FinalCta() {
  return (
    <section className="py-16 sm:py-24 bg-[#2563EB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Pronto para transformar sua engenharia?</h2>
        <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
          Junte-se a mais de 500 empresas que ja economizam tempo e dinheiro com o Projeta Pro.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[#2563EB] bg-white hover:bg-blue-50 rounded-xl transition-colors duration-200 shadow-lg"
          >
            Comece gratis por 14 dias
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href="#"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 hover:border-white/60 rounded-xl transition-colors duration-200"
          >
            Agendar demonstracao
          </a>
        </div>
      </div>
    </section>
  )
}
