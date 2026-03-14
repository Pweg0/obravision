export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="py-10 border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo / brand */}
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "#1A6B5A" }}
          >
            P
          </span>
          <span className="text-foreground font-bold text-base tracking-tight">
            Projeta<span className="text-primary">Pro</span>
          </span>
          <span className="text-muted-foreground text-sm">&copy; {year}</span>
        </div>

        {/* Links */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6">
            <li>
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200 cursor-pointer"
              >
                Recursos
              </a>
            </li>
            <li>
              <a
                href="#lead-capture"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200 cursor-pointer"
              >
                Participar do beta
              </a>
            </li>
            <li>
              <a
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200 cursor-pointer"
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
