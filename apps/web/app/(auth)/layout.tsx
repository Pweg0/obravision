import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-primary/90 to-primary items-center justify-center p-12">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-md">
          <Link
            href="/"
            className="flex items-center gap-3 text-white font-bold text-2xl tracking-tight hover:opacity-90 transition-opacity mb-10"
            aria-label="ProjetaPro — pagina inicial"
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 text-white font-bold text-lg backdrop-blur-sm">
              P
            </span>
            ProjetaPro
          </Link>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Gestao de obras visual para a construcao civil
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Comentarios ancorados em plantas, versionamento de projetos e
            integracao campo-escritorio em uma unica plataforma.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-4 py-8">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
            aria-label="ProjetaPro — pagina inicial"
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{ backgroundColor: "#1A6B5A" }}
              aria-hidden="true"
            >
              P
            </span>
            Projeta<span className="text-primary">Pro</span>
          </Link>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-[420px]">{children}</div>

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ProjetaPro. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
