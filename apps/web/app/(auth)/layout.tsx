import type { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      {/* Logo */}
      <div className="mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
          aria-label="ProjetaPro — pagina inicial"
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base"
            style={{ backgroundColor: "#1A6B5A" }}
            aria-hidden="true"
          >
            O
          </span>
          ProjetaPro
        </Link>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} ProjetaPro. Todos os direitos reservados.
      </p>
    </div>
  )
}
