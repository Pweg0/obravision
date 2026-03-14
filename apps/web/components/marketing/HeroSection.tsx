import { ArrowRight, Building2, MessageSquareText, FileStack } from "lucide-react"

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10 dark:via-background" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating accent orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Product badge */}
        <div className="inline-flex items-center gap-2 bg-primary/[0.08] dark:bg-primary/[0.15] border border-primary/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-sm font-medium">Beta aberto — cadastre-se agora</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6 tracking-tight animate-fade-in">
          Gerencie suas obras{" "}
          <br className="hidden sm:block" />
          com{" "}
          <span className="text-primary">precisao</span> visual
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
          Comentarios ancorados em plantas, versionamento de projetos e integracao
          campo-escritorio em uma unica plataforma para engenheiros e construtoras.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 animate-fade-in">
          <a
            href="#lead-capture"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-all duration-200 min-w-[200px] shadow-premium hover:shadow-premium-lg cursor-pointer"
          >
            Comecar gratis
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-border hover:border-foreground/20 text-foreground font-medium text-base transition-all duration-200 min-w-[200px] hover:bg-secondary/50 cursor-pointer"
          >
            Conhecer recursos
          </a>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
            <MessageSquareText className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Comentarios em plantas</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
            <FileStack className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Versionamento</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground font-medium">Gestao de obras</span>
          </div>
        </div>
      </div>
    </section>
  )
}
