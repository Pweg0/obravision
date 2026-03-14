export function DetailedFeature() {
  return (
    <section className="py-16 sm:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-[#2563EB] uppercase tracking-wider mb-3">Visibilidade total</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">
              Chega de planilhas e WhatsApp para gerenciar obras
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              O Projeta Pro substitui planilhas espalhadas, mensagens perdidas e relatorios manuais por uma plataforma unica e integrada.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { bold: "Diario de obra digital", text: "Registre atividades, fotos e ocorrencias direto do celular." },
                { bold: "Alertas inteligentes", text: "Receba notificacoes de estoque baixo, prazos e vistorias." },
                { bold: "Relatorios automaticos", text: "Gere relatorios de progresso com um clique para enviar ao cliente." },
              ].map((item) => (
                <li key={item.bold} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-[#1E293B]">{item.bold}</span> — {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Feature mockup */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/30 border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="space-y-3">
                {[
                  { name: "Planta Baixa - Bloco A", sub: "Revisao 3 - Atualizada ha 1h", badge: "Aprovada", badgeColor: "text-green-600 bg-green-50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
                  { name: "Estrutural - Fundacao", sub: "Revisao 5 - Atualizada ha 3h", badge: "Em revisao", badgeColor: "text-amber-600 bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
                  { name: "Hidraulica - Pavimento 2", sub: "Revisao 1 - Nova", badge: "Nova", badgeColor: "text-blue-600 bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center`}>
                        <svg className={`w-4 h-4 ${item.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.sub}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${item.badgeColor} px-2 py-1 rounded-full`}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
