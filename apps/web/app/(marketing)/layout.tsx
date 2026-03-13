import Link from "next/link"
import type { ReactNode } from "react"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — NO auth checks (pitfall: do not call auth() here) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 font-bold text-xl tracking-tight hover:text-emerald-700 transition-colors"
            aria-label="ObraVision — pagina inicial"
          >
            <span
              className="w-7 h-7 rounded flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#1A6B5A" }}
              aria-hidden="true"
            >
              O
            </span>
            ObraVision
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-6" aria-label="Navegacao principal">
            <a
              href="/#features"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Recursos
            </a>
            <a
              href="/#lead-capture"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Beta
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 hover:border-slate-400 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Entrar
            </Link>
          </nav>

          {/* Mobile Entrar link */}
          <Link
            href="/login"
            className="sm:hidden inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
