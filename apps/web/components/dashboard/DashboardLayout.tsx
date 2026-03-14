"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useObraNav } from "@/providers/ObraNavProvider"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  LayoutDashboard,
  Building2,
  Bell,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Info,
  Users,
  Tags,
  Map,
  CalendarDays,
  BookOpen,
  DollarSign,
  ShoppingCart,
  Package,
  Ruler,
  Home,
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    name: string | null
    email: string | null
    image: string | null
    role: string
  }
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/obras", label: "Obras", icon: Building2 },
  { href: "/dashboard/notificacoes", label: "Notificacoes", icon: Bell },
]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ENGENHEIRO: "Engenheiro",
  CLIENTE: "Cliente",
}

function getObraNavItems(obraId: string) {
  return [
    { href: `/dashboard/obras/${obraId}`, label: "Inicio", icon: Home, exact: true },
    { href: `/dashboard/obras/${obraId}/detalhes`, label: "Detalhes", icon: Info },
    { href: `/dashboard/obras/${obraId}/equipe`, label: "Equipe", icon: Users },
    { href: `/dashboard/obras/${obraId}/status`, label: "Status", icon: Tags },
    { href: `/dashboard/obras/${obraId}/plantas`, label: "Plantas", icon: Map },
    { href: `/dashboard/obras/${obraId}/cronograma`, label: "Cronograma", icon: CalendarDays },
    { href: `/dashboard/obras/${obraId}/rdo`, label: "Diario", icon: BookOpen },
    { href: `/dashboard/obras/${obraId}/orcamento`, label: "Orcamentos", icon: DollarSign },
    { href: `/dashboard/obras/${obraId}/compras`, label: "Compras", icon: ShoppingCart },
    { href: `/dashboard/obras/${obraId}/estoque`, label: "Estoque", icon: Package },
    { href: `/dashboard/obras/${obraId}/medicoes`, label: "Medicoes", icon: Ruler },
  ]
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg transition-all duration-200 cursor-pointer group",
        isActive
          ? "bg-white/15 text-white"
          : "text-white/50 hover:bg-white/10 hover:text-white/80"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[9px] font-medium uppercase tracking-wide leading-tight text-center">
        {label}
      </span>
    </Link>
  )
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const obraNav = useObraNav()

  const displayName = user.name ?? user.email ?? "Usuario"
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isInsideObra = !!obraNav
  const obraItems = isInsideObra ? getObraNavItems(obraNav.obraId) : []

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-out lg:static lg:translate-x-0",
          isInsideObra ? "w-[220px]" : "w-[82px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "linear-gradient(180deg, #1a2332 0%, #0f1724 100%)" }}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 flex-shrink-0",
          isInsideObra ? "justify-between px-4" : "justify-center"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">
              P<span className="text-emerald-400">P</span>
            </span>
            {isInsideObra && (
              <span className="text-white/60 text-xs font-medium">ProjetaPro</span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/50 hover:text-white cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-2 space-y-1 overflow-y-auto scrollbar-thin">
          {isInsideObra ? (
            <>
              {/* Back to Obras */}
              <Link
                href="/dashboard/obras"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:bg-white/10 hover:text-white/70 transition-all duration-200 cursor-pointer text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </Link>

              {/* Obra name as title */}
              <div className="px-3 py-3 mb-1">
                <p className="text-white font-semibold text-sm truncate">
                  {obraNav.obraNome}
                </p>
                <div className="w-8 h-0.5 bg-emerald-400 rounded-full mt-1.5" />
              </div>

              {/* Obra nav items - horizontal with icon + text */}
              {obraItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-sm",
                      isActive
                        ? "bg-white/15 text-white font-medium"
                        : "text-white/50 hover:bg-white/10 hover:text-white/80"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          ) : (
            <>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
                return (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    onClick={() => setMobileOpen(false)}
                  />
                )
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-2 flex-shrink-0">
          {isInsideObra ? (
            <div className="flex items-center gap-3 px-2 py-2">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white font-medium truncate">{displayName}</p>
                <p className="text-[10px] text-white/40">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-white/30 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-semibold">
                  {initials}
                </div>
              )}
              <span className="text-[8px] text-white/40 uppercase tracking-wide text-center truncate w-full px-1">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-white/30 hover:text-white transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-primary lg:hidden">Projeta Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
