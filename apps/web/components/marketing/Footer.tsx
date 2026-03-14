export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="py-8 bg-slate-900 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo / brand */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">ProjetaPro</span>
          <span className="text-slate-500 text-sm">&copy; {year}</span>
        </div>

        {/* Links — minimal for beta */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6">
            <li>
              <a
                href="#features"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Recursos
              </a>
            </li>
            <li>
              <a
                href="#lead-capture"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Participar do beta
              </a>
            </li>
            <li>
              <a
                href="/login"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Entrar
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
