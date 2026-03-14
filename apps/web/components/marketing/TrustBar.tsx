export function TrustBar() {
  const companies = [
    "ConstrutechBR",
    "Engemax",
    "CivilPlan",
    "ObraFacil",
    "TecnoStruct",
  ]

  return (
    <section className="py-10 sm:py-14 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-gray-400 mb-8 uppercase tracking-wider">
          Mais de 500 empresas de engenharia confiam no Projeta Pro
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 grayscale">
          {companies.map((name) => (
            <span key={name} className="text-xl font-bold text-gray-700">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
