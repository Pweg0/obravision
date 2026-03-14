const faqs = [
  {
    q: "Preciso instalar algum software?",
    a: "Nao. O Projeta Pro funciona 100% no navegador e tambem tem aplicativo para celular (iOS e Android). Basta criar sua conta e comecar a usar.",
  },
  {
    q: "Posso migrar meus dados de planilhas?",
    a: "Sim. Temos importacao via CSV e Excel. Nos planos Profissional e Enterprise, nossa equipe ajuda na migracao completa dos seus dados.",
  },
  {
    q: "Funciona offline no canteiro de obras?",
    a: "Sim. O app mobile permite registrar atividades, fotos e anotacoes offline. Quando a conexao voltar, tudo sincroniza automaticamente.",
  },
  {
    q: "Qual o prazo do periodo de teste?",
    a: "14 dias com acesso completo a todas as funcionalidades do plano escolhido. Nao pedimos cartao de credito para iniciar.",
  },
]

export function FaqSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">Perguntas frequentes</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="group border border-gray-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-semibold text-[#1E293B] hover:bg-gray-50 transition-colors duration-200 list-none">
                {faq.q}
                <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
