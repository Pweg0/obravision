import Link from "next/link"
import type { ReactNode } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Floating header */}
      <header className="sticky top-0 z-50 w-full">
        <div className="mx-4 mt-3 md:mx-6 lg:mx-8">
          <div className="glass rounded-2xl shadow-glass">
            <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2.5 text-foreground font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
                aria-label="ProjetaPro — pagina inicial"
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
                  style={{ backgroundColor: "#1A6B5A" }}
                  aria-hidden="true"
                >
                  P
                </span>
                <span>Projeta<span className="text-primary">Pro</span></span>
              </Link>

              {/* Navigation */}
              <nav className="hidden sm:flex items-center gap-1" aria-label="Navegacao principal">
                <a
                  href="/#features"
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-secondary/60 cursor-pointer"
                >
                  Recursos
                </a>
                <a
                  href="/#lead-capture"
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-secondary/60 cursor-pointer"
                >
                  Beta
                </a>
                <div className="w-px h-5 bg-border mx-2" />
                <ThemeToggle />
                <Link
                  href="/login"
                  className="ml-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors duration-200 cursor-pointer"
                >
                  Entrar
                </Link>
              </nav>

              {/* Mobile */}
              <div className="sm:hidden flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
