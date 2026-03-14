const starIcon = (
  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const testimonials = [
  {
    quote: "Antes do Projeta Pro, perdiamos horas por semana com planilhas e ligacoes. Agora tenho visao completa de 8 obras simultaneas no meu celular.",
    name: "Ricardo Costa",
    role: "Diretor, Costa Engenharia",
    initials: "RC",
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    quote: "O controle de estoque com alertas automaticos nos economizou mais de R$15.000 no primeiro trimestre. Material parado era um problema serio.",
    name: "Ana Martins",
    role: "Gerente de Obras, Martins Construcoes",
    initials: "AM",
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    quote: "A funcionalidade de plantas e sensacional. Minha equipe de campo acessa a versao mais recente direto no canteiro, sem confusao com revisoes antigas.",
    name: "Paulo Santos",
    role: "Engenheiro Civil, Santos & Filhos",
    initials: "PS",
    bg: "bg-amber-100",
    color: "text-amber-600",
  },
]

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-16 sm:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">O que nossos clientes dizem</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <span key={i}>{starIcon}</span>)}
              </div>
              <blockquote className="text-sm text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${t.bg} rounded-full flex items-center justify-center ${t.color} font-bold text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
