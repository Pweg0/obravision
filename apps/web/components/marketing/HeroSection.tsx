import Link from "next/link"

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1A6B5A 0%, #0f4a3e 50%, #0a3229 100%)",
      }}
    >
      {/* Subtle geometric background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        {/* Product badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-white/90 text-sm font-medium">Beta em breve — cadastre-se agora</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Gerencie suas obras com{" "}
          <span className="text-emerald-300">precisao</span> e{" "}
          <span className="text-emerald-300">colaboracao visual</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Comentarios ancorados diretamente nas plantas, versionamento de projetos e integracao
          campo-escritorio — tudo em uma unica plataforma para engenheiros e construtoras.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#lead-capture"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-semibold text-base transition-colors duration-200 min-w-[180px]"
          >
            Quero testar
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg border border-white/30 hover:border-white/60 text-white font-medium text-base transition-colors duration-200 min-w-[180px]"
          >
            Conhecer recursos
          </a>
        </div>

        {/* Trust indicators */}
        <p className="mt-8 text-white/50 text-sm">
          Desenvolvido para a construcao civil brasileira — sem complicacao
        </p>
      </div>
    </section>
  )
}
