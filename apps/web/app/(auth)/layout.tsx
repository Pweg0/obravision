import type { ReactNode } from "react"
import Link from "next/link"
import { ProjetaProLogo } from "@/components/ProjetaProLogo"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#2563EB]/90 to-[#1D4ED8] items-center justify-center p-12">
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
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
              <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                <path d="M8 24V10L16 6L24 10V24L16 20L8 24Z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
                <path d="M16 6V20" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            Projeta Pro
          </Link>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Gestao inteligente para engenharia civil
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Empresa, obras, estoque e plantas em uma unica plataforma.
            Reduza custos e entregue projetos no prazo.
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
          >
            <ProjetaProLogo size="md" />
            <span>Projeta <span className="text-primary">Pro</span></span>
          </Link>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-[420px]">{children}</div>

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Projeta Pro. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
