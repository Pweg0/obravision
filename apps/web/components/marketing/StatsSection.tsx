export function StatsSection() {
  const stats = [
    { value: "35%", label: "Reducao de custos com estoque" },
    { value: "2x", label: "Mais rapido na emissao de relatorios" },
    { value: "500+", label: "Empresas ativas na plataforma" },
    { value: "98%", label: "Satisfacao dos clientes" },
  ]

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#2563EB]">{stat.value}</p>
              <p className="mt-2 text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
